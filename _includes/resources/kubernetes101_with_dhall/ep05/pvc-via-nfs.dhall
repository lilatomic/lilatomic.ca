let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let Optional/map =
      https://raw.githubusercontent.com/dhall-lang/dhall-lang/master/Prelude/Optional/map.dhall

let nfsPVC =
      λ(pvc : k8s.PersistentVolumeClaim.Type) →
        let nfsSpec =
              Optional/map
                k8s.PersistentVolumeClaimSpec.Type
                k8s.PersistentVolumeClaimSpec.Type
                ( λ(s : k8s.PersistentVolumeClaimSpec.Type) →
                    s
                    with storageClassName = Some "nfs-client"
                )
                pvc.spec

        in  pvc
          with spec = nfsSpec

let example0 =
      let metadata = k8s.ObjectMeta::{=}

      let actual =
            nfsPVC
              k8s.PersistentVolumeClaim::{
              , metadata
              , spec = Some k8s.PersistentVolumeClaimSpec::{
                , storageClassName = Some "slow"
                }
              }

      let expected =
            k8s.PersistentVolumeClaim::{
            , metadata
            , spec = Some k8s.PersistentVolumeClaimSpec::{
              , storageClassName = Some "nfs-client"
              }
            }

      in  assert : actual ≡ expected

in  nfsPVC
