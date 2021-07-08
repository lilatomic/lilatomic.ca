let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let name = "cr"

let hostname = "localhost:5000"

let metadata
    : k8s.ObjectMeta.Type
    = k8s.ObjectMeta::{
      , name = Some name
      , namespace = Some "container-registry"
      }

let registry_pvc
    : k8s.PersistentVolumeClaim.Type
    = let spec =
            k8s.PersistentVolumeClaimSpec::{
            , accessModes = Some [ "ReadWriteOnce" ]
            , resources = Some k8s.ResourceRequirements::{
              , requests = Some (toMap { storage = "10Gi" })
              }
            }

      in  k8s.PersistentVolumeClaim::{ metadata, spec = Some spec }

let registry_deployment
    : k8s.Deployment.Type
    = let labels = Some (toMap { name })

      let meta_labeled = metadata with labels = labels

      let template =
            k8s.PodTemplateSpec::{
            , metadata = meta_labeled
            , spec = Some k8s.PodSpec::{
              , containers =
                [ k8s.Container::{ name, image = Some "registry:2" } ]
              , volumes = Some
                [ k8s.Volume::{
                  , name
                  , persistentVolumeClaim = Some k8s.PersistentVolumeClaimVolumeSource::{
                    , claimName = name
                    }
                  }
                ]
              }
            }

      let spec =
            k8s.DeploymentSpec::{
            , selector = k8s.LabelSelector::{ matchLabels = labels }
            , template
            , replicas = Some 1
            }

      in  k8s.Deployment::{ metadata = meta_labeled, spec = Some spec }

let registry_service =
      let spec =
            k8s.ServiceSpec::{
            , ports = Some
              [ k8s.ServicePort::{
                , port = 80
                , targetPort = Some (k8s.IntOrString.Int 5000)
                }
              ]
            , selector = Some (toMap { name })
            }

      in  k8s.Service::{ metadata, spec = Some spec }

let registry_ingress =
      let ingress_annotations =
            Some
              ( toMap
                  { `nginx.ingress.kubernetes.io/ingress.class` = "nginx"
                  , `nginx.ingress.kubernetes.io/proxy-body-size` = "500m"
                  , `nginx.ingress.kubernetes.io/proxy-pass-headers` =
                      "Location"
                  }
              )

      let spec
          : k8s.IngressSpec.Type
          = k8s.IngressSpec::{
            , tls = Some
              [ k8s.IngressTLS::{
                , hosts = Some [ hostname ]
                , secretName = Some "registry-secret-tls"
                }
              ]
            , rules = Some
              [ k8s.IngressRule::{
                , host = Some hostname
                , http = Some
                  { paths =
                    [ { path = Some "/"
                      , backend =
                        { serviceName = name
                        , servicePort = k8s.IntOrString.Int 5000
                        }
                      }
                    ]
                  }
                }
              ]
            }

      in  k8s.Ingress::{
          , metadata = metadata with annotations = ingress_annotations
          , spec = Some spec
          }

let u =
      https://raw.githubusercontent.com/dhall-lang/dhall-kubernetes/master/typesUnion.dhall sha256:d7b8c9c574f3c894fa2bca9d9c2bec1fea972bb3acdde90e473bc2d6ee51b5b1

in  { apiVersion = "v1"
    , kind = "List"
    , items =
      [ u.Deployment registry_deployment
      , u.Service registry_service
      , u.Ingress registry_ingress
      , u.PersistentVolumeClaim registry_pvc
      ]
    }
