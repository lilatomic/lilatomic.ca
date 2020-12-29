let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let deployment =
      ./hello-go-function.dhall
        "hello-go"
        k8s.Container::{
        , name = "kube101-go"
        , image = Some "localhost:5000/hello-go:1.0.0"
        }

let service = ./hello-go-service.dhall

let u =
      https://raw.githubusercontent.com/dhall-lang/dhall-kubernetes/master/typesUnion.dhall sha256:d7b8c9c574f3c894fa2bca9d9c2bec1fea972bb3acdde90e473bc2d6ee51b5b1

in  { apiVersion = "v1"
    , kind = "List"
    , items = [ u.Deployment deployment, u.Service service ]
    }
