let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let Optional/map =
      https://raw.githubusercontent.com/dhall-lang/dhall-lang/master/Prelude/Optional/map.dhall

let PVC = ../ep04/drupal-files-pvc.dhall

let nfsPVC =
      λ(namespace : Text) →
      λ(name : Text) →
        let drupalPVC = PVC namespace name

        let nfsSpec =
              Optional/map
                k8s.PersistentVolumeClaimSpec.Type
                k8s.PersistentVolumeClaimSpec.Type
                ( λ(s : k8s.PersistentVolumeClaimSpec.Type) →
                    s
                    with storageClassName = Some "nfs-client"
                )
                drupalPVC.spec

        in  drupalPVC
          with spec = nfsSpec

in  nfsPVC
