let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

in  λ(spec : { port : Text, initialDelaySeconds : Natural }) →
      Some
        k8s.Probe::{
        , initialDelaySeconds = Some spec.initialDelaySeconds
        , tcpSocket = Some k8s.TCPSocketAction::{
          , port = k8s.IntOrString.String spec.port
          }
        }
