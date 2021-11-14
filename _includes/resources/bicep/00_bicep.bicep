resource storageAccount 'Microsoft.Storage/storageAccounts@2021-06-01' = {
  name: 'biceptest27924'
  location: 'canadaeast'
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: 'biceptest27924'
  location: 'canadaeast'
  sku: {
    name: 'F1'
  }
}

resource appServiceApp 'Microsoft.Web/sites@2021-02-01' = {
  name: 'biceptest27924'
  location: 'canadaeast'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
  }
}
