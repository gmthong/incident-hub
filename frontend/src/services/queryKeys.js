// Central names prevent different pages from creating conflicting cache entries.
export const queryKeys = Object.freeze({
  analyses:{
    all:["analyses"],
    detail:(uid) => ["analyses", "detail", uid],
    forIncident:(incidentUid) => ["analyses", "incident", incidentUid],
  },
  auth:{
    me:["auth", "me"],
  },
  categories:{
    all:["categories"],
    detail:(uid) => ["categories", "detail", uid],
  },
  incidents:{
    all:["incidents"],
    detail:(uid) => ["incidents", "detail", uid],
    list:(parameters) => ["incidents", "list", parameters],
    reportedBy:(userUid, parameters) => ["incidents", "reported-by", userUid, parameters],
    summary:["incidents", "summary"],
  },
  users:{
    all:["users"],
    detail:(uid) => ["users", "detail", uid],
    list:(parameters) => ["users", "list", parameters],
  },
})
