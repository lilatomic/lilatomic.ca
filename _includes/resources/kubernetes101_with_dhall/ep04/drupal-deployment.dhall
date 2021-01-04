let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let resources = ./container-resources.dhall

let mkProbe = ./mkProbe.dhall

in  λ(namespace : Text) →
    λ(name : Text) →
    λ(image : Text) →
    λ(drupalSettingsConfigmapName : Text) →
    λ(drupalFilesPVCName : Text) →
      let matchLabels = toMap { app = name }

      let drupalSettingsVolumeName = "drupal-settings"

      let drupalFilesVolumeName = "drupal-files"

      let drupalContainer =
            k8s.Container::{
            , name
            , image = Some image
            , ports = Some [ k8s.ContainerPort::{ containerPort = 80 } ]
            , livenessProbe = mkProbe { port = "80", initialDelaySeconds = 30 }
            , readinessProbe = mkProbe { port = "80", initialDelaySeconds = 10 }
            , volumeMounts = Some
              [ k8s.VolumeMount::{
                , mountPath = "/var/www/html/sites/default/"
                , name = drupalSettingsVolumeName
                }
              , k8s.VolumeMount::{
                , mountPath = "/var/www/html/sites/default/files"
                , name = drupalFilesVolumeName
                }
              ]
            , resources = resources.default_resources
            }

      let volumes =
            [ k8s.Volume::{
              , name = drupalSettingsVolumeName
              , configMap = Some k8s.ConfigMapVolumeSource::{
                , name = Some drupalSettingsConfigmapName
                }
              }
            , k8s.Volume::{
              , name = drupalFilesVolumeName
              , persistentVolumeClaim = Some k8s.PersistentVolumeClaimVolumeSource::{
                , claimName = drupalFilesPVCName
                }
              }
            ]

      let initContainer =
            k8s.Container::{
            , name = "init-files"
            , image = Some image
            , command = Some [ "/bin/bash", "-c" ]
            , args = Some
              [ "cp -r /var/www/html/sites/default/files /data; chown www-data:www-data /data/ -R"
              ]
            , volumeMounts = Some
              [ k8s.VolumeMount::{
                , name = drupalFilesVolumeName
                , mountPath = "/data"
                }
              ]
            }

      let podspec =
            k8s.PodSpec::{
            , containers = [ drupalContainer ]
            , initContainers = Some [ initContainer ]
            , volumes = Some volumes
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
