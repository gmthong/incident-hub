// Central names prevent different pages from creating conflicting cache entries.
export const queryKeys = Object.freeze({
  analyses:{
    all:["analyses"],
    detail:(uid) => ["analyses", "detail", uid],
  },
  auth:{
    me:["auth", "me"],
  },
  categories:{
    all:["categories"],
  },
  incidents:{
    all:["incidents"],
    detail:(uid) => ["incidents", "detail", uid],
    reportedBy:(userUid) => ["incidents", "reported-by", userUid],
  },
  users:{
    all:["users"],
    detail:(uid) => ["users", "detail", uid],
  },
})
