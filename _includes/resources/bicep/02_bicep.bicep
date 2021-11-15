@secure()
@description('secret admin password')
param adminPassword string

resource vm 'Microsoft.Compute/virtualMachines@2021-07-01' = {
  name: 'dev-vm'
  location: resourceGroup().location
  properties: {
    osProfile: {
      adminPassword: adminPassword
    }
  }
}
