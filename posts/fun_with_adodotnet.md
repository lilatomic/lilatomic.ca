---
title: Fun with ADO.NET
description: Things I've figured out about ADO.NET
date: 2020-12-09
tags:
  - VB
  - dotnet
  - hindsight
layout: layouts/post.njk
---

# Fun with ADO.NET

## Column is not in Table, but it definitely is

### Problem

Maybe you've got some code which is like the following, which accesses a field by a column reference. This particular snippet converts DBNull to Nothing (null), which is kinda useful I guess.

``` vb 
Public Shared Function GetField(ByVal row As EntityBase, ByVal field As DataColumn) As Object
	Dim obj As Object = row.DataRow.Item(field)
	If TypeOf obj Is DBNull Then
		Return Nothing
	End If
	Return obj
End Function
```

You might find that you're getting some error about `"Column '{{ColumnName}}' does not belong to table {{TableName}}."`, but you are 100% sure that the column actually is there. Maybe you've even cracked it open in the debugger and checked that the Table definitely has that column. 

### Possible Cause

One possibility is that the Columns are actually checked by reference equality, not value equality. So if you somehow have a new or different instance of the Table, the Column from one will not be found in the other. This could happen if you've recreated the DB but haven't updated things which reference columns. For example, maybe the application has a handy "reload data" button which recreates the tables and reloads from the DB, but doesn't purge an in-memory list (maybe it's even tightly bound in a UI component). Another way you could end up with different DBs is in tests. You might create and seed a Table, and separately reference columns from a Table inside your test.

For extra fun, this doesn't seem to be a problem in the .Net Framework 2, but _is_ in the .Net Framework 4. So that's exciting.