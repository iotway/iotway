const Table = require ('cli-table');
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
    cpu: 'Load %'
};

exports.getDefaultApp = function (){
    return ['author', 'appId', 'name', 'platform', 'privileged'];
};

exports.getDefaultCluster = function (){
    return ['name', 'platform', 'clusterId', 'errorNumber'];
};

exports.getDefaultDeploy = function (){
    return ['deployId', 'target', 'type', 'version', 'targetId'];
};

exports.getDefaultProduct = function (){
    return ['name', 'productId', 'type', 'status', 'cpu', 'latestStatus'];
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
    let returnHeader = [];
    for (let a of argv){
        returnHeader.push (header[a]);
    }   
    return returnHeader;
}