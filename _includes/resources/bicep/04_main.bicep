var cosmosDBAccountName = 'testbicep'

module cosmos '04_bicep.bicep' = {
  name: 'cosmos'
  params: {
    cosmosDBAccountName: cosmosDBAccountName
  }
}

resource cosmosDBAccount 'Microsoft.DocumentDB/databaseAccounts@2020-04-01' existing = {
  name: cosmosDBAccountName
}

resource lockResource 'Microsoft.Authorization/locks@2016-09-01' = {
  scope: cosmosDBAccount
  name: 'DontDeleteMain'
  properties: {
    level: 'CanNotDelete'
    notes: 'Prevents deletion of the toy data Cosmos DB account.'
  }
}
