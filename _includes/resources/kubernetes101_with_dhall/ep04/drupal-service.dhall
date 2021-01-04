let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

in  λ(namespace : Text) →
    λ(name : Text) →
      let spec
          : k8s.ServiceSpec.Type
          = k8s.ServiceSpec::{
            , ports = Some
              [ k8s.ServicePort::{
                , port = 80
                , targetPort = Some (k8s.IntOrString.Int 80)
                , protocol = Some "TCP"
                }
              ]
            , selector = Some (toMap { app = name })
            , type = Some "NodePort"
            }

      in  k8s.Service::{
          , metadata = k8s.ObjectMeta::{
            , name = Some name
            , namespace = Some namespace
            }
          , spec = Some spec
          }
