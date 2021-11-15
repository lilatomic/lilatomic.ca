param kvName string

resource keyVault 'Microsoft.KeyVault/vaults@2021-06-01-preview' existing = {
  name: kvName
}

module devVm '02_bicep.bicep' = {
  name: 'devVm'
  params: {
    adminPassword: keyVault.getSecret('vm-admin-password')
  }
}
