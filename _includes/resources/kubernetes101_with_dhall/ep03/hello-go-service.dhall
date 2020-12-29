let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let spec
    : k8s.ServiceSpec.Type
    = k8s.ServiceSpec::{
      , ports = Some
        [ k8s.ServicePort::{
          , port = 8480
          , targetPort = Some (k8s.IntOrString.Int 8180)
          , protocol = Some "TCP"
          }
        ]
      , selector = Some (toMap { name = "hello-go" })
      , type = Some "NodePort"
      }

let service
    : k8s.Service.Type
    = k8s.Service::{
      , metadata = k8s.ObjectMeta::{
        , labels = Some (toMap { name = "hello-go" })
        , name = Some "hello-go"
        }
      , spec = Some spec
      }

in  service
