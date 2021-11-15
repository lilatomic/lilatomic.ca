targetScope = 'subscription'

resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'bicep-test'
  location: 'canadacentral'
}

module mod '05_module.bicep' = {
  scope: resourceGroup
  name: 'bicep-test-rg'
  params: {
    cosmosDBAccountName: 'bicep-test'
  }
}
