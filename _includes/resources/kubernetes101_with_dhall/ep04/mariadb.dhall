let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let PVC = ./pvc.dhall

let deployment = ./mariadb-deployment.dhall

let service = ./service.dhall

let u =
      https://raw.githubusercontent.com/dhall-lang/dhall-kubernetes/master/typesUnion.dhall sha256:d7b8c9c574f3c894fa2bca9d9c2bec1fea972bb3acdde90e473bc2d6ee51b5b1

let mkMariadb =
      λ(namespace : Text) →
      λ(dbCredentials : { user : Text, password : Text }) →
        let filesPVCName = "mariadb-pvc"

        in  { apiVersion = "v1"
            , kind = "List"
            , items =
              [ u.PersistentVolumeClaim (PVC namespace filesPVCName)
              , u.Deployment
                  ( deployment
                      namespace
                      "mariadb"
                      "mariadb:10.5"
                      filesPVCName
                      dbCredentials
                  )
              , u.Service
                  ( service
                      namespace
                      "mariadb"
                      k8s.ServicePort::{
                      , port = 3306
                      , targetPort = Some (k8s.IntOrString.Int 3306)
                      }
                  )
              ]
            }

in  mkMariadb "drupal" { user = env:MYSQL_USER, password = env:MYSQL_PASSWORD }
