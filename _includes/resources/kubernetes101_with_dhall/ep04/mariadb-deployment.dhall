let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let resources = ./container-resources.dhall

let mkEnv = ./mkEnv.dhall

let dbCredentials = { user : Text, password : Text }

in  λ(namespace : Text) →
    λ(name : Text) →
    λ(image : Text) →
    λ(mariadbPVCName : Text) →
    λ(dbCredentials : dbCredentials) →
      let matchLabels = toMap { app = name }

      let dbVolumeName = "database"

      let resources =
            resources.mkResources
              { limits = { cpu = "2", memory = "512Mi" }
              , requests = { cpu = "500m", memory = "256Mi" }
              }

      let mariadbContainer =
            k8s.Container::{
            , name
            , image = Some image
            , ports = Some [ k8s.ContainerPort::{ containerPort = 3306 } ]
            , resources
            , volumeMounts = Some
              [ k8s.VolumeMount::{
                , mountPath = "/var/lib/mysql"
                , name = dbVolumeName
                }
              ]
            , env = Some
                ( mkEnv
                    ( toMap
                        { MYSQL_DATABASE = "drupal"
                        , MYSQL_USER = dbCredentials.user
                        , MYSQL_PASSWORD = dbCredentials.password
                        , MYSQL_RANDOM_ROOT_PASSWORD = "yes"
                        }
                    )
                )
            }

      let podspec =
            k8s.PodSpec::{
            , containers = [ mariadbContainer ]
            , volumes = Some
              [ k8s.Volume::{
                , name = dbVolumeName
                , persistentVolumeClaim = Some k8s.PersistentVolumeClaimVolumeSource::{
                  , claimName = mariadbPVCName
                  }
                }
              ]
            }

      let template =
            k8s.PodTemplateSpec::{
            , metadata = k8s.ObjectMeta::{ labels = Some matchLabels }
            , spec = Some podspec
            }

      let spec =
            k8s.DeploymentSpec::{
            , selector = k8s.LabelSelector::{ matchLabels = Some matchLabels }
            , template
            }

      in  k8s.Deployment::{
          , metadata = k8s.ObjectMeta::{
            , name = Some name
            , namespace = Some namespace
            }
          , spec = Some spec
          }
