const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const Members = artifacts.require('Members')
const Kernel = artifacts.require('Kernel')
const ACL = artifacts.require('ACL')
const DAOFactory = artifacts.require('DAOFactory')


const MEMBER_INDEX_ADDRESS = 0
const MEMBER_INDEX_NAME = 1
const MEMBER_INDEX_LEVEL = 2
const MEMBER_INDEX_REPUTATION = 3
const MEMBER_MIN_NAME_LENGTH = 3
const MEMBER_MAX_NAME_LENGTH = 30
const MEMBER_INITIAL_REPUTATION = 1

const MemberLevels = {
  NONE: 0,
  JUNIOR: 1,
  INTERMEDIATE: 2,
  SENIOR: 3,
  EXPERT: 4,
}

const DEFAULT_MEMBERS_INITIAL_REPUTATION = 1
const MEMBERS_ID = '0x01'

contract('Members', async (accounts) => {
  let app
  const root = accounts[0]
  const NULL_ADDRESS = '0x00'

  before(async () => {
    const kernelBase = await Kernel.new(true) // petrify immediately
    const aclBase = await ACL.new()
    daoFactory = await DAOFactory.new(
      kernelBase.address,
      aclBase.address,
      NULL_ADDRESS
    )

    // Setup constants
    APP_MANAGER_ROLE = await kernelBase.APP_MANAGER_ROLE()
  })

  beforeEach(async () => {
    const daoTx = await daoFactory.newDAO(root)
    const dao = Kernel.at(
      daoTx.logs.filter(log => log.event == 'DeployDAO')[0].args.dao
    )
    const acl = ACL.at(await dao.acl())

    await acl.createPermission(root, dao.address, APP_MANAGER_ROLE, root, {
      from: root
    })

    app = await installApp(
      dao,
      Members,
      MEMBERS_ID,
      root,
      DEFAULT_MEMBERS_INITIAL_REPUTATION
    )

    await configurePermissions(
      acl,
      app
    )
    const newMemberAddress = accounts[0]
    const newMemberName = 'Pesho'
    const newMemberLevel = MemberLevels.INTERMEDIATE

    await app.addMember(
      newMemberAddress,
      newMemberName,
      newMemberLevel, {
        from: accounts[0]
      }
    )
  })

  it('should add a new member correctly', async () => {
    const memberCount = (await app.getMembersCount.call()).toNumber()
    const newMemberAddress = accounts[1]
    const newMemberName = 'Pesho'
    const newMemberLevel = MemberLevels.INTERMEDIATE

    await app.addMember(
      newMemberAddress,
      newMemberName,
      newMemberLevel, {
        from: accounts[0]
      }
    )
    

    const initialReputation = (await app.initialReputation.call()).toNumber()

    const member = await app.getMember.call(memberCount)
    assert.equal(newMemberAddress, member[MEMBER_INDEX_ADDRESS],
      'Member wasn\'t added with the correct address')
    assert.equal(newMemberName, member[MEMBER_INDEX_NAME],
      'Member wasn\'t added with the correct name')
    assert.equal(newMemberLevel, member[MEMBER_INDEX_LEVEL],
      'Member wasn\'t added with the correct level')
    assert.equal(initialReputation, member[MEMBER_INDEX_REPUTATION],
      'Member wasn\'t added with the correct reputation')

    const newCount = await app.getMembersCount.call()
    assert.equal(memberCount + 1, newCount.toNumber(),
      'Member count didn\'t increase')
  })  

  it('should not add a member with an invalid name', async () => {
    const shortMemberAddress = accounts[1]
    const shortMemberName = 'Pe'
    const longMemberAddress = accounts[2]
    const longMemberName = 'Peuhwefheufheifhwiuefhweuisdsda'

    await assertRevert(() =>
      app.addMember(shortMemberAddress,
        shortMemberName,
        MemberLevels.JUNIOR, {
          from: accounts[0]
        })
    )
    await assertRevert(() =>
      app.addMember(longMemberAddress,
        longMemberName,
        MemberLevels.JUNIOR, {
          from: accounts[0]
        }))
  })

  it('should not add a member with the same address twice', async () => {
    const newMemberAddress = accounts[3]
    const newMemberName = 'Pesho'
    const newMemberLevel = MemberLevels.JUNIOR

    await app.addMember(newMemberAddress, newMemberName, newMemberLevel, {
      from: accounts[0]
    })
    await assertRevert(() =>
      app.addMember(
        newMemberAddress,
        newMemberName,
        newMemberLevel, {
          from: accounts[0]
        }))
  })

  it('shouldn\'t update a member\'s name if it\'s invalid', async () => {
    const newAddress = accounts[4]
    const newName = 'Pesho'
    const newLevel = MemberLevels.INTERMEDIATE

    const updatedNameShort = 'Go'
    const updatedNameLong = 'Gooidjiodfjeiwojoiejfoejwfoiejfiojweoijfoefejf'

    await app.addMember(
      newAddress,
      newName,
      newLevel, {
        from: accounts[0]
      }
    )

    const updatedMemberIndex = await app.getMembersCount.call() - 1

    assertRevert(() =>
      app.setMemberName(updatedMemberIndex, updatedNameShort, {
        from: accounts[0]
      }))
    assertRevert(() =>
      app.setMemberName(updatedMemberIndex, updatedNameLong, {
        from: accounts[0]
      }))
  })

  it('shouldn\'t update a member\'s address if it\'s invalid', async () => {
    const newAddress = accounts[5]
    const newName = 'Pesho'
    const newLevel = MemberLevels.INTERMEDIATE

    await app.addMember(
      newAddress,
      newName,
      newLevel, {
        from: accounts[0]
      }
    )

    const updatedMemberIndex = await app.getMembersCount.call() - 1

    const updatedAddress = '0x0000000000000000000000000000000000000000'

    assertRevert(() =>
      app.setMemberAddress(updatedMemberIndex, updatedAddress, {
        from: accounts[0]
      }))
  })

  it('shouldn\'t update a member\'s level if it\'s invalid', async () => {
    const newAddress = accounts[6]
    const newName = 'Pesho'
    const newLevel = MemberLevels.INTERMEDIATE

    await app.addMember(
      newAddress,
      newName,
      newLevel, {
        from: accounts[0]
      }
    )

    const updatedMemberIndex = await app.getMembersCount.call() - 1

    const updatedLevel = 34

    assertRevert(() =>
      app.setMemberLevel(updatedMemberIndex, updatedLevel, {
        from: accounts[0]
      }))
  })

  it('should update a member correctly', async () => {
    const newMemberAddress = accounts[7]
    const newMemberName = 'Pesho'
    const newMemberLevel = MemberLevels.INTERMEDIATE

    const updatedMemberName = 'Gosho'
    const updatedMemberAddress = accounts[6]
    const updatedMemberLevel = MemberLevels.SENIOR
    const updatedMemberReputation = 23

    await app.addMember(
      newMemberAddress,
      newMemberName,
      newMemberLevel)

    const updatedMemberIndex = await app.getMembersCount.call() - 1

    await app.updateMember(
      updatedMemberIndex,
      updatedMemberAddress,
      updatedMemberName,
      updatedMemberLevel)
    await app.setMemberReputation(updatedMemberIndex, updatedMemberReputation)

    const member = await app.getMember.call(updatedMemberIndex)
    assert.equal(updatedMemberAddress, member[MEMBER_INDEX_ADDRESS],
      'Member wasn\'t updated with the correct address')
    assert.equal(updatedMemberName, member[MEMBER_INDEX_NAME],
      'Member wasn\'t updated with the correct name')
    assert.equal(updatedMemberLevel, member[MEMBER_INDEX_LEVEL],
      'Member wasn\'t updated with the correct level')
    assert.equal(updatedMemberReputation, member[MEMBER_INDEX_REPUTATION],
        'Member wasn\'t updated with the correct reputation')
    assertRevert(() => app.getMemberByAddress.call(newMemberAddress))    
  })

  it('should remove a member correctly', async () => {
    const newMemberAddress = accounts[1]
    const newMemberName = 'Gosho'
    const newMemberLevel = MemberLevels.INTERMEDIATE

    await app.addMember(
      newMemberAddress,
      newMemberName,
      newMemberLevel
    )

    const memberCount = (await app.getMembersCount.call()).toNumber()

    const memberToRemoveId = memberCount - 1
    await app.removeMember(memberToRemoveId)

    let newMemberCount = (await app.getMembersCount.call()).toNumber()
    assert.equal(newMemberCount + 1, memberCount, 'Member wasn\'t removed correctly')

    await assertRevert(() => app.getMember(memberToRemoveId))

    const secondMemberToRemoveId = 0
    await app.removeMember(secondMemberToRemoveId)

    newMemberCount = (await app.getMembersCount.call()).toNumber()
    assert.equal(newMemberCount + 2, memberCount, 'Second member wasn\'t removed correctly')

    await assertRevert(() => app.getMember(memberCount - 1))
  })

  const installApp = async (dao, contractClass, appId, root, ...initArgs) => {
    const baseContract = await contractClass.new()
  
    const receipt = await dao.newAppInstance(
      appId,
      baseContract.address,
      '0x',
      false,
      {
        from: root
      }
    )
    const proxyAddress = receipt.logs.filter(log => log.event == 'NewAppProxy')[0]
      .args.proxy
  
    const appInstance = contractClass.at(proxyAddress)
    appInstance.initialize(...initArgs, { from: root })
  
    return appInstance
  }

  const configurePermissions = async (
    acl,
    membersApp
  ) => {
    const MANAGE_MEMBERS_ROLE = await membersApp.MANAGE_MEMBERS_ROLE()
    await acl.createPermission(
      root,
      membersApp.address,
      MANAGE_MEMBERS_ROLE,
      root,
      { from: root }
    )
  }
})
