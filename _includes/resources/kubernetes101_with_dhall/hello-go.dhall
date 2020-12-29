let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let template
    : k8s.PodTemplateSpec.Type
    = k8s.PodTemplateSpec::{
      , metadata = k8s.ObjectMeta::{ name = Some "hello-go" }
      , spec = Some k8s.PodSpec::{
        , containers =
          [ k8s.Container::{
            , name = "kube101-go"
            , image = Some "geerlingguy/kube101-go:1.0.0"
            }
          ]
        }
      }

let spec
    : k8s.DeploymentSpec.Type
    = k8s.DeploymentSpec::{
      , selector = k8s.LabelSelector::{
        , matchLabels = Some (toMap { name = "hello-go" })
        }
      , template
      , replicas = Some 1
      }

let deployment =
      k8s.Deployment::{
      , metadata = k8s.ObjectMeta::{
        , name = Some "hello-go"
        , labels = Some (toMap { app = "hello-go" })
        }
      , spec = Some spec
      }

in  deployment
