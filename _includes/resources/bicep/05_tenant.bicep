targetScope = 'subscription'

resource parentManagementGroup 'Microsoft.Management/managementGroups@2020-05-01' = {
  scope: tenant()
  name: 'NonProduction'
  properties: {
    displayName: 'Non-production'
  }
}
