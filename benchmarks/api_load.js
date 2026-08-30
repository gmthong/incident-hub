import http from "k6/http"
import exec from "k6/execution"
import { check, sleep } from "k6"
import { Counter, Rate, Trend } from "k6/metrics"


const BASE_URL = (__ENV.BASE_URL || "http://localhost:8001").replace(/\/$/, "")
const API_URL = `${BASE_URL}/api/v1`
const PROFILE = __ENV.PROFILE || "smoke"
const BENCHMARK_USER_COUNT = Number(__ENV.BENCHMARK_USER_COUNT || 500)
const STEADY_VUS = Number(__ENV.STEADY_VUS || 25)
const STEADY_DURATION = __ENV.STEADY_DURATION || "2m"
const PASSWORD = "LoadTest1"

const benchmarkRequests = new Counter("benchmark_requests")
const benchmarkErrors = new Rate("benchmark_error_rate")
const benchmarkLatency = new Trend("benchmark_latency", true)
const loginErrors = new Rate("login_error_rate")

const profileOptions = {
  smoke:{
    scenarios:{
      smoke:{
        executor:"shared-iterations",
        exec:"concurrentUserWorkflow",
        vus:2,
        iterations:20,
        maxDuration:"1m",
      },
    },
  },
  volume:{
    scenarios:{
      volume:{
        executor:"shared-iterations",
        exec:"volumeRead",
        vus:20,
        iterations:1000,
        maxDuration:"5m",
      },
    },
  },
  concurrency:{
    scenarios:{
      concurrency:{
        executor:"ramping-vus",
        exec:"concurrentUserWorkflow",
        startVUs:0,
        stages:[
          {duration:"30s", target:10},
          {duration:"30s", target:25},
          {duration:"30s", target:50},
          {duration:"30s", target:100},
          {duration:"2m", target:100},
          {duration:"30s", target:0},
        ],
        gracefulRampDown:"30s",
      },
    },
  },
  steady:{
    scenarios:{
      steady:{
        executor:"constant-vus",
        exec:"concurrentUserWorkflow",
        vus:STEADY_VUS,
        duration:STEADY_DURATION,
        gracefulStop:"30s",
      },
    },
  },
  stress:{
    scenarios:{
      stress:{
        executor:"ramping-vus",
        exec:"concurrentUserWorkflow",
        startVUs:0,
        stages:[
          {duration:"30s", target:100},
          {duration:"30s", target:250},
          {duration:"1m", target:500},
          {duration:"1m", target:500},
          {duration:"30s", target:0},
        ],
        gracefulRampDown:"30s",
      },
    },
  },
}

if (!profileOptions[PROFILE]) {
  throw new Error(`Unknown PROFILE '${PROFILE}'. Use smoke, volume, steady, concurrency, or stress.`)
}

export const options = {
  ...profileOptions[PROFILE],
  thresholds:{
    benchmark_error_rate:["rate<0.01"],
    benchmark_latency:["p(95)<1000"],
  },
  summaryTrendStats:["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
}

let userSession = null


function accountEmail(number) {
  return `load-user-${String(number).padStart(4, "0")}@example.com`
}


function parseJson(response) {
  try {
    return response.json()
  } catch {
    return null
  }
}


function login(email, tags={}) {
  return http.post(
    `${API_URL}/auth/login`,
    JSON.stringify({email, password:PASSWORD}),
    {
      headers:{"Content-Type":"application/json"},
      tags:{name:"POST /auth/login", benchmark:"false", ...tags},
    },
  )
}


function ensureUserSession() {
  if (userSession) {
    return userSession
  }

  const accountNumber = ((exec.vu.idInTest - 1) % BENCHMARK_USER_COUNT) + 1
  const response = login(accountEmail(accountNumber), {phase:"vu-login"})
  const body = parseJson(response)
  const validLogin = check(response, {
    "virtual user login succeeded":(result) => result.status === 200 && Boolean(body?.access_token),
  })
  loginErrors.add(!validLogin)

  if (!validLogin) {
    if (PROFILE === "stress") {
      return null
    }
    exec.test.abort(`Virtual user login failed with status ${response.status}`)
  }

  userSession = {
    token:body.access_token,
    uid:body.user.uid,
  }
  return userSession
}


function authParams(token, operation) {
  return {
    headers:{
      Authorization:`Bearer ${token}`,
      "Content-Type":"application/json",
    },
    tags:{name:operation, benchmark:"true"},
  }
}


function record(response, expectedStatus, operation) {
  const success = check(response, {
    [`${operation} returned ${expectedStatus}`]:(result) => result.status === expectedStatus,
  })
  benchmarkRequests.add(1, {operation})
  benchmarkErrors.add(!success, {operation})
  benchmarkLatency.add(response.timings.duration, {operation})
  return response
}


function randomIncidentUid(data) {
  return data.incidentUids[Math.floor(Math.random() * data.incidentUids.length)]
}


export function setup() {
  const loginResponse = login(accountEmail(1), {phase:"setup"})
  const loginBody = parseJson(loginResponse)
  if (loginResponse.status !== 200 || !loginBody?.access_token) {
    exec.test.abort(`Benchmark setup login failed with status ${loginResponse.status}`)
  }

  const incidentsResponse = http.get(
    `${API_URL}/incidents/`,
    authParams(loginBody.access_token, "SETUP /incidents"),
  )
  const incidentPage = parseJson(incidentsResponse)
  const incidents = Array.isArray(incidentPage?.items) ? incidentPage.items : []
  if (incidentsResponse.status !== 200 || incidents.length === 0) {
    exec.test.abort("Benchmark setup could not load seeded incidents")
  }

  return {
    incidentUids:incidents.map((incident) => incident.uid),
    sharedToken:loginBody.access_token,
  }
}


export function volumeRead(data) {
  const operation = "GET /incidents/{uid}"
  const incidentUid = randomIncidentUid(data)
  record(
    http.get(`${API_URL}/incidents/${incidentUid}`, authParams(data.sharedToken, operation)),
    200,
    operation,
  )
}


export function concurrentUserWorkflow(data) {
  const session = ensureUserSession()
  if (!session) {
    sleep(1)
    return
  }
  const choice = Math.random() * 100

  if (choice < 35) {
    const operation = "GET /incidents"
    record(http.get(`${API_URL}/incidents/`, authParams(session.token, operation)), 200, operation)
  } else if (choice < 60) {
    const operation = "GET /incidents/{uid}"
    const incidentUid = randomIncidentUid(data)
    record(
      http.get(`${API_URL}/incidents/${incidentUid}`, authParams(session.token, operation)),
      200,
      operation,
    )
  } else if (choice < 75) {
    const operation = "GET /categories"
    record(http.get(`${API_URL}/categories/`, authParams(session.token, operation)), 200, operation)
  } else if (choice < 85) {
    const operation = "GET /incidents/users/{uid}"
    record(
      http.get(`${API_URL}/incidents/users/${session.uid}`, authParams(session.token, operation)),
      200,
      operation,
    )
  } else if (choice < 90) {
    const operation = "GET /auth/me"
    record(http.get(`${API_URL}/auth/me`, authParams(session.token, operation)), 200, operation)
  } else if (choice < 95) {
    const operation = "POST /incidents"
    const suffix = `${exec.vu.idInTest}-${exec.scenario.iterationInTest}`
    record(
      http.post(
        `${API_URL}/incidents/`,
        JSON.stringify({
          title:`Load test incident ${suffix}`,
          affected_service:"benchmark-api",
          environment:"benchmark",
          occurred_at:new Date().toISOString(),
          status:"OPEN",
        }),
        authParams(session.token, operation),
      ),
      201,
      operation,
    )
  } else {
    const operation = "POST /incidents/{uid}/analyses"
    const incidentUid = randomIncidentUid(data)
    record(
      http.post(
        `${API_URL}/incidents/${incidentUid}/analyses`,
        JSON.stringify({
          severity:"MEDIUM",
          analysis_text:`Load-test analysis from virtual user ${exec.vu.idInTest}`,
        }),
        authParams(session.token, operation),
      ),
      201,
      operation,
    )
  }

  sleep(0.5 + Math.random())
}
