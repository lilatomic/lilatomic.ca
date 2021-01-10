let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545


in  λ(namespace : Text) →
    λ(name : Text) →
      k8s.PersistentVolumeClaim::{
      , metadata = k8s.ObjectMeta::{ name = Some name, namespace = Some namespace }
      , spec = Some k8s.PersistentVolumeClaimSpec::{
        , accessModes = Some [ "ReadWriteOnce" ]
        , resources = Some k8s.ResourceRequirements::{
          , requests = Some (toMap { storage = "1Gi" })
          }
        }
      }
