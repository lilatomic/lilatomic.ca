let x_opt = { x : Optional Natural, y : Optional Natural }

let x_only = { x : Optional Natural }

let q
    : x_opt
    = { x = Some 1, y = None Natural }

let f = λ(a : x_only) → merge { Some = λ(i : Natural) → i + 1, None = 0 } a.x

let o = f q.(x_only)

let t0 = < PVCName : Text >

let t1 = < ConfigMapName : Text >

let tx = < PVCName : Text | ConfigMapName : Text >

let v0
    : tx.PVCName
    = tx.PVCName "I"

let v1
    : tx
    = v0

in  { v0 }
