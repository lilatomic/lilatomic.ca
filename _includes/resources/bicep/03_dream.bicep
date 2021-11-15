@description('The Azure region into which the resources should be deployed.')
param location string

@secure()
@description('The administrator login username for the SQL server.')
param sqlServerAdministratorLogin string

@secure()
@description('The administrator login password for the SQL server.')
param sqlServerAdministratorLoginPassword string

@description('The name and tier of the SQL database SKU.')
param sqlDatabaseSku object = {
  name: 'Standard'
  tier: 'Standard'
}

@allowed([
  'Development'
  'Production'
])
param environmentName string
param auditStorageAccountName string = 'bearaudit${uniqueString(resourceGroup().id)}'

var sqlServerName = 'teddy${location}${uniqueString(resourceGroup().id)}'
var sqlDatabaseName = 'TeddyBear'

var auditingEnabled = environmentName == 'Production'
var storageAccountSkuName = 'Standard_LRS'

resource sqlServer 'Microsoft.Sql/servers@2020-11-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlServerAdministratorLogin
    administratorLoginPassword: sqlServerAdministratorLoginPassword
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2020-11-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: sqlDatabaseSku
}

// reminder, this doesn't work
if (auditingEnabled) {
  resource auditStorageAccount 'Microsoft.Storage/storageAccounts@2021-02-01' = {
    name: auditStorageAccountName
    location: location
    sku: {
      name: storageAccountSkuName
    }
    kind: 'StorageV2'
  }

  resource auditingSettings 'Microsoft.Sql/servers/auditingSettings@2020-11-01-preview' = {
    parent: sqlServer
    name: 'default'
    properties: {
      state: 'Enabled'
      storageEndpoint: auditStorageAccount.properties.primaryEndpoints.blob
      storageAccountAccessKey: listKeys(auditStorageAccount.id, auditStorageAccount.apiVersion).keys[0].value
    }
  }
}
