let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let resource_spec = { cpu : Text, memory : Text }

let resource_type = { limits : resource_spec, requests : resource_spec }

let default
    : resource_type
    = { limits = { cpu = "500m", memory = "512Mi" }
      , requests = { cpu = "250m", memory = "256Mi" }
      }

let mkResources =
      λ(r : resource_type) →
        Some
          k8s.ResourceRequirements::{
          , limits = Some (toMap r.limits)
          , requests = Some (toMap r.requests)
          }

in  { Type = resource_type
    , default
    , mkResources
    , default_resources = mkResources default
    }
