def test_health_reports_incidenthub(client):
    """Happy path: the health endpoint reports the API identity."""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status":"healthy",
        "service":"incidenthub-api",
    }


def test_health_rejects_unsupported_method(client):
    """Unhappy path: the health endpoint rejects unsupported methods."""
    response = client.post("/health")

    assert response.status_code == 405
