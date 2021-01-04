let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let config = ./drupal-config.dhall

let files = ./drupal-files-pvc.dhall

let deployment = ./drupal-deployment.dhall

let service = ./drupal-service.dhall

let u =
      https://raw.githubusercontent.com/dhall-lang/dhall-kubernetes/master/typesUnion.dhall sha256:d7b8c9c574f3c894fa2bca9d9c2bec1fea972bb3acdde90e473bc2d6ee51b5b1

let mkDrupal =
      λ(namespace : Text) →
        let filesPVCName = "drupal-files-pvc"

        let configMapName = "drupal-config"

        in  { apiVersion = "v1"
            , kind = "List"
            , items =
              [ u.ConfigMap (config namespace configMapName)
              , u.PersistentVolumeClaim (files namespace filesPVCName)
              , u.Deployment
                  ( deployment
                      namespace
                      "drupal"
                      "drupal:9-apache"
                      configMapName
                      filesPVCName
                  )
              , u.Service (service namespace "drupal")
              ]
            }

in  mkDrupal "drupal"
