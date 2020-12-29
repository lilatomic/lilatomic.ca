let Optional/null =
      https://raw.githubusercontent.com/dhall-lang/dhall-lang/master/Prelude/Optional/null.dhall sha256:3871180b87ecaba8b53fffb2a8b52d3fce98098fab09a6f759358b9e8042eedc

let List/any =
      https://raw.githubusercontent.com/dhall-lang/dhall-lang/master/Prelude/List/any.dhall sha256:b8e9e13b25e799f342a81f6eda4075906eb1a19dfdcb10a0ca25925eba4033b8

let k8s =
      https://raw.githubusercontent.com/dhall-lang/dhall-k8s/master/package.dhall sha256:ef3845f617b91eaea1b7abb5bd62aeebffd04bcc592d82b7bd6b39dda5e5d545

let u =
      https://raw.githubusercontent.com/dhall-lang/dhall-kubernetes/master/typesUnion.dhall sha256:d7b8c9c574f3c894fa2bca9d9c2bec1fea972bb3acdde90e473bc2d6ee51b5b1

let Bool/not =
      https://raw.githubusercontent.com/dhall-lang/dhall-lang/master/Prelude/Bool/not.dhall sha256:723df402df24377d8a853afed08d9d69a0a6d86e2e5b2bac8960b0d4756c7dc4

let check =
      λ(l : List (Optional u)) →
        Bool/not (List/any (Optional u) (Optional/null u) l)

in  check
