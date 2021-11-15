@allowed([
  'Development'
  'Production'
])
param environmentName string

var isProd = (environmentName == 'Production')

resource testAppServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = if (!isProd) {
  name: 'biceptest27924'
  location: 'canadaeast'
  sku: {
    name: 'F1'
  }
}

resource prodAppServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = if (isProd) {
  name: 'bicepprod27924'
  location: 'canadaeast'
  sku: {
    name: 'F1'
  }
}

var appServicePlan = isProd ? prodAppServicePlan : testAppServicePlan

output appServicePlan string = appServicePlan.name
