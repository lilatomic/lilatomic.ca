let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let mkProbe =
      λ(initialDelaySeconds : Natural) →
        Some
          k8s.Probe::{
          , initialDelaySeconds = Some initialDelaySeconds
          , tcpSocket = Some k8s.TCPSocketAction::{
            , port = k8s.IntOrString.String "80"
            }
          }

in  λ(namespace : Text) →
    λ(name : Text) →
    λ(image : Text) →
    λ(drupalSettingsVolume : k8s.ConfigMap.Type) →
    λ(drupalFilesVolume : k8s.PersistentVolumeClaim.Type) →
      let matchLabels = toMap { app = name }

      let volumeSettingsName = drupalSettingsVolume.metadata.name

      let drupalContainer =
            k8s.Container::{
            , name
            , image = Some image
            , ports = Some [ k8s.ContainerPort::{ containerPort = 80 } ]
            , livenessProbe = mkProbe 30
            , readinessProbe = mkProbe 10
            , volumeMounts = Some
              [ k8s.VolumeMount::{
                , mountPath = "/var/www/html/sites/default/"
                , name = volumeSettingsName
                }
              ]
            }

      let podspec = k8s.PodSpec::{ containers = [ drupalContainer ] }

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
          }
