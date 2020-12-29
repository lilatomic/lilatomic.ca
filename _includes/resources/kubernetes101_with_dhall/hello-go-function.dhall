let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let go-deployment =
      λ(name : Text) →
      λ(container : k8s.Container.Type) →
        let meta =
              k8s.ObjectMeta::{
              , name = Some name
              , labels = Some (toMap { name })
              }

        let template
            : k8s.PodTemplateSpec.Type
            = k8s.PodTemplateSpec::{
              , metadata = meta
              , spec = Some k8s.PodSpec::{ containers = [ container ] }
              }

        let spec
            : k8s.DeploymentSpec.Type
            = k8s.DeploymentSpec::{
              , selector = k8s.LabelSelector::{
                , matchLabels = Some (toMap { name })
                }
              , template
              , replicas = Some 1
              }

        let deployment = k8s.Deployment::{ metadata = meta, spec = Some spec }

        in  deployment

let example0 =
      go-deployment
        "hello-go"
        k8s.Container::{
        , name = "kube101-go"
        , image = Some "localhost:5000/hello-go:1.0.0"
        }

in  go-deployment
