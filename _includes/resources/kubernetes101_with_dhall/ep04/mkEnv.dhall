let Map =
      https://prelude.dhall-lang.org/v20.0.0/Map/Type.dhall sha256:210c7a9eba71efbb0f7a66b3dcf8b9d3976ffc2bc0e907aadfb6aa29c333e8ed

let Entry =
      https://prelude.dhall-lang.org/v20.0.0/Map/Entry.dhall sha256:f334283bdd9cd88e6ea510ca914bc221fc2dab5fb424d24514b2e0df600d5346

let List/map =
      https://raw.githubusercontent.com/dhall-lang/dhall-lang/master/Prelude/List/map.dhall sha256:dd845ffb4568d40327f2a817eb42d1c6138b929ca758d50bc33112ef3c885680

let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let t =
      λ(e : Entry Text Text) →
        k8s.EnvVar::{ name = e.mapKey, value = Some e.mapValue }

in  λ(es : Map Text Text) → List/map (Entry Text Text) k8s.EnvVar.Type t es
