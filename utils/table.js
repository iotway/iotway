const Table = require ('cli-table');
const _ = require ('lodash');
const appHeader = {
    author: 'Author',
    appId: 'Id',
    name: 'Name',
    platform: 'Platform',
    privileged: 'Privileged',
    network: 'Network',
    ownerId: 'Owner Id'
};

const clusterHeader = {
    name: 'Name',
    openRegister: 'Open Register',
    ownerId: 'Owner Id',
    errorNumber: 'Error',
    platform: 'Platform',
    clusterId: 'Id',
    filterRegister: 'Filter Register'
};

const deployHeader = {
    appId: 'App Id',
    target: 'Target',
    type: 'Type',
    version: 'Version',
    rollback: 'Rollback',
    privileged: 'Privileged',
    network: 'Network',
    deployId: 'Deploy Id',
    targetId: 'Target Id'
};

const productHeader = {
    clusterId: 'Cluster Id',
    ownerId: 'Owner Id',
    serial: 'Serial',
    type: 'Type',
    shell: 'Shell',
    latestTokenRefresh: 'Token Refresh',
    name: 'Name',
    token: 'Token',
    registerDate: 'Registered',
    registerType: 'Register',
    platform: 'Platform',
    latestStatus: 'Latest Accessed',
    logNumber: 'Max Logs',
    errorNumber: 'Max Errors',
    status: 'Status',
    allow: 'Enabled',
    upFrame: 'UpFrame',
    productId: 'Product Id',
    cpu: 'Load %',
    actions: 'Scheduled'
};

const projectHeader = {
    projectId: 'Project Id',
    name: 'Name',
    appId: 'Application Id',
    short_name: 'Short Name',
    platform: 'Platform',
    ownerId: 'Owner Id',
    ui: 'UI',

};

const emulatorImageHeader = {
    platform: 'Platform',
    version: 'Version',
    machine: 'Machine',
    cpu: 'CPU Type',
    cmdline: 'Kernel Command Line',
    mem: "Memory Size",
    hda: 'Storage',
    kernel: 'Kernel',
    dtb: 'Device Tree'
};

const emulatorPlatformHeader = _.assign (emulatorImageHeader,
{
    link: 'Download Link'
});

const emulatorHeader = _.assign (
    {
        productId: 'productId'
    }, emulatorImageHeader);

exports.getDefaultProject = function (){
    return ['projectId', 'name', 'platform', 'ui'];
};

exports.getDefaultApp = function (){
    return ['author', 'appId', 'name', 'platform', 'privileged'];
};

exports.getDefaultCluster = function (){
    return ['name', 'platform', 'clusterId'];
};

exports.getDefaultDeploy = function (){
    return ['deployId', 'target', 'type', 'version', 'targetId'];
};

exports.getDefaultProduct = function (){
    return ['name', 'productId', 'type', 'status', 'actions', 'cpu', 'latestStatus'];
};

exports.getDefaultEmulatorImage = function (){
    return ['platform', 'version'];
}

exports.getDefaultEmulatorPlatform = exports.getDefaultEmulatorImage;

exports.getDefaultEmulator = function ()
{
    return ['productId', 'platform', 'version'];
}

exports.getWideProject = function (){
    let returnVlues = [];
    for (let h in projectHeader){
        returnVlues.push (h);
    }
    return returnVlues;
};

exports.getWideApp = function (){
    let returnVlues = [];
    for (let h in appHeader){
        returnVlues.push (h);
    }
    return returnVlues;
};

exports.getWideCluster = function (){
    let returnVlues = [];
    for (let h in clusterHeader){
        returnVlues.push (h);
    }
    return returnVlues;
};

exports.getWideDeploy = function (){
    let returnVlues = [];
    for (let h in deployHeader){
        returnVlues.push (h);
    }
    return returnVlues;
};

exports.getWideProduct = function (){
    return ['clusterId', 'type', 'shell', 'name',
    'registerDate', 'platform', 'latestStatus', 'status', 'allow', 'productId', 'cpu'];
}

exports.getWideEmulatorImage = function (){
    return Object.keys (emulatorImageHeader);
};

exports.getWideEmulatorPlatform = function (){
    return Object.keys (emulatorPlatformHeader);
};

exports.getWideEmulator = function (){
    return Object.keys (emulatorHeader);
};

exports.header = function (argv, type){
    let header;
    if (type === 'app'){
        header = appHeader;
    }
    else if (type === 'cluster'){
        header = clusterHeader;
    }
    else if (type === 'deploy'){
        header = deployHeader;
    }
    else if (type === 'product'){
        header = productHeader;
    }
    else if (type === 'project'){
        header = projectHeader;
    }
    else if (type === 'emulatorImage'){
        header = emulatorImageHeader;
    }
    else if (type === 'emulatorPlatform'){
        header = emulatorPlatformHeader;
    }
    else if (type === 'emulator'){
        header = emulatorHeader;
    }
    if (header){
        let returnHeader = [];
        for (let a of argv){
            returnHeader.push (header[a]);
        }   
        return returnHeader;
    }
    return [];
}