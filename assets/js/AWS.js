/**
 * Created by Ibrahim on 4/4/2016.
 */
var AmazonWebService = (function(){

    var accessKeyId;
    var secretAccessKey;
    var defaultRegion;
    var runningInstances;
    var AllUserInstances;
    var credentials;
    var ec2;
    var regionNames;

    function init() {
        RegisterListeners();
        defaultRegion = "us-east-1";
        regionNames = {
            "us-east-1" : "US East (N. Virginia)",
            "us-west-1" : "US West (N. California)",
            "us-west-2" : "US West (Oregon)",
            "eu-west-1" : "EU (Ireland)",
            "eu-central-1" : "EU (Frankfurt)",
            "ap-northeast-1" : "Asia Pacific (Tokyo)",
            "ap-northeast-2" : "Asia Pacific (Seoul)",
            "ap-southeast-1" : "Asia Pacific (Singapore)",
            "ap-southeast-2" : "Asia Pacific (Sydney)",
            "sa-east-1" : "South America (São Paulo)"
        };
    }

    function RegisterListeners(){
        // $('#service_selector').change(function(){
        //     var opt = $(this).val();
        //     if (opt == "aws") {
        //         console.log("changed...");
        //         if(credentials == null){
        //             $('#myModalNorm').modal('show');
        //         }
        //     }
        // });

        $("#continueButton").click(function(){
            if($("#service_selector .selected").attr("id") == "aws"){
                var accessKeyElem = $("#awsPublicKey");
                var secretKeyElem = $("#awsSecretKey");
                var accessKey= accessKeyElem.val();
                var secretKey= secretKeyElem.val();
                if(!accessKey) {
                    accessKeyElem.closest('.form-group').removeClass('has-success').addClass('has-error');
                    $("#error-message").html(
                        "<div class=\"alert text-left alert-danger alert-dismissible\" role=\"alert\">"+
                        "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">"+
                            "<span aria-hidden=\"true\">&times;</span>"+
                        "</button>"+
                        "<strong>Error!</strong> Must Enter Public Key "+
                        "</div>");
                    return false;
                }else if(!secretKey){
                    accessKeyElem.closest('.form-group').removeClass('has-error').addClass('has-success');
                    secretKeyElem.closest('.form-group').removeClass('has-success').addClass('has-error');
                    $("#error-message").html(
                        "<div class=\""+"alert text-left alert-danger alert-dismissible\""+" role=\"alert\">"+
                        "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">"+
                        "<span aria-hidden=\"true\">&times;</span>"+
                        "</button>"+
                        "<strong>Error!</strong> Must Enter Secret Key "+
                        "</div>");
                    return false;
                }else{
                    accessKeyElem.closest('.form-group').removeClass('has-error').addClass('has-success');
                    secretKeyElem.closest('.form-group').removeClass('has-error').addClass('has-success');
                    var region = defaultRegion;
                    configureCredentialsAndRegion(accessKey, secretKey, region);
                    populateAndDisplayForm();
                }
            }
        });
        // $("form[name='form']").submit(function (event) {
        //     event.preventDefault();
        //     var accessKey = $("input[name='accessKey']").val();
        //     var secretKey = $("input[name='secretKey']").val();
        //     var region = defaultRegion;
        //     configureCredentialsAndRegion(accessKey, secretKey, region);
        // });
    }

    //  http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html#constructor-property
    function configureCredentialsAndRegion(accessKey, secretKey, region){
        accessKeyId = accessKey;
        secretAccessKey = secretKey;
        credentials = new AWS.Credentials(accessKeyId, secretAccessKey, null);
        AWS.config.credentials = credentials;

        // Configure the region
        defaultRegion = region;
        AWS.config.region = defaultRegion;

        //  Instantiate an EC2 object
        ec2 = new AWS.EC2();

        console.log(AWS.config);
        // createEC2Instance(null);
        // getAllUserInstances();
        // getAllImages();
        // startInstance()
        // createKeyPair("abcd");
    }

    function populateAndDisplayForm(){
        $("#bootstrapSelectForm").removeClass("hidden");
        getAvailabilityZones(defaultRegion);
        getRegions();
    }

    /*
    * Input: Object
    *
    * Object contains:
    *
    * InstanceType,
    * InstanceName,
    * KeyName
    * */
    //http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#runInstances-property
    function createEC2Instance(instanceObj) {

        console.log("running create instance");

        if(instanceObj==null || instanceObj.KeyName == null)
            return false;



        var params = {
            ImageId: 'ami-fce3c696', // Ubuntu Server 14.04 LTS (HVM), SSD Volume Type 64 bit
            InstanceType: instanceObj.instanceType || 't2.micro',
            Placement:{
                // AvailabilityZone: defaultRegion    // Specify the Availability Zone, To specify multiple Availability Zones, separate them using commas; for example, "us-west-2a, us-west-2b".
            },
            KeyName: instanceObj.KeyName,
            InstanceInitiatedShutdownBehavior: 'stop',
            MinCount: 1,    // minimum number of instances to launch
            MaxCount: 1     // maximum number of instances to launch
        };

        // Create the instance
        ec2.runInstances(params, function(err, data) {
            if (err) {
                console.log("Could not create instance", err);
                return;
            }

            var instanceId = data.Instances[0].InstanceId;
            console.log("Created instance", instanceId);

            // Add Name tag to the instance
            params = {Resources: [instanceId], Tags: [
                {Key: 'Name', Value: instanceObj.instanceName | instanceObj.instanceType}
            ]};
            ec2.createTags(params, function(err) {
                console.log("Tagging instance", err ? "failure" : "success");
            });
        });
    }


    /*
    *   Accepts an array of Image IDs to start
    * */
    function startInstance(ImageIds){
        var params = {
            InstanceIds: ImageIds
        };

        ec2.startInstances(params, function(){
            if(err){
                console.log(err, err.stack);
            }
            else{
                console.log(data);
            }
        });

    }

    //  Get all instances belonging to the user
    //  http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeInstances-property
    function getAllUserInstances(){
        AllUserInstances = [];
        var params = {
            DryRun: false
        };

        ec2.describeInstances(params, function(err, data){
            if (err){
                console.log(err, err.stack); // an error occurred
            }
            else{
                // console.log(data);           // successful response
                $.each(data.Reservations, function(key, group){
                    // console.log(key);
                    // console.log(group);
                    $.each(group.Instances, function(position, instance){
                        // console.log(position);
                        // console.log(instance);
                        AllUserInstances.push(instance);
                    });
                });
            }
            return AllUserInstances;
        });
    }

    //  Get all the regions
    //  http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeRegions-property
    function getRegions(){
        var params = {
            DryRun: false
        };

        App.blockUI({
            target: "#bootstrapSelectForm",
            animate: true
        });

        ec2.describeRegions(params, function(err, data) {
            if (err)
                console.log(err, err.stack); // an error occurred
            else{
                console.log(data);           // successful response
                $("#region_selector").empty();
                $.each(data.Regions, function(index, obj){
                    $("#region_selector").append("<option value='"+obj.RegionName+"'>"+decodeURIComponent(escape(regionNames[obj.RegionName]))+"</option>");
                });
            }
            App.unblockUI("#bootstrapSelectForm");
        });
    }

    //Get all the availability zones in a region
    //  http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeAvailabilityZones-property
    function getAvailabilityZones(region){
        var params = {
            DryRun: false,
            Filters: [
                {
                    Name: 'region-name',
                    Values: [
                        region
                    ]
                }
            ]
        };
        ec2.describeAvailabilityZones(params, function(err, data) {
            if (err)
                console.log(err, err.stack); // an error occurred
            else{
                console.log(data);           // successful response
                $("#availability_zone_selector").empty();
                $.each(data.AvailabilityZones, function(index, obj){
                    if(obj.State == "available"){
                        $("#availability_zone_selector").append("<option value='"+obj.ZoneName+"'>"+obj.ZoneName+"</option>");
                    }
                });
            }
        });
    }

    function createKeyPair(keyName) {
        var keyObj = {};
        var params = {
            KeyName: keyName, /* required */
            DryRun: false
        };

        ec2.createKeyPair(params, function(err, data) {
            if (err){
                console.log(err, err.stack);    // an error occurred}
            }
            else{
                // console.log(data);  // successful response
                var privateKeyString = data.KeyMaterial.match("(\-\-\-\-\-BEGIN RSA PRIVATE KEY\-\-\-\-\-)([\\s\\S]*)(\-\-\-\-\-END RSA PRIVATE KEY\-\-\-\-\-)")[2];
                privateKeyString = privateKeyString.replace(/^\s+|\s+$/gm,'');
                $.extend(keyObj, {
                    KeyFingerprint: data.KeyFingerprint,
                    KeyName: data.KeyName,
                    PrivateKey: privateKeyString
                });
                console.log(keyObj);
            }
        });
    }

    //  Get all images available to the user
    //  http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeImages-property
    function getAllImages(){
        var params = {
            Filters:[
                {
                    Name: "block-device-mapping.volume-size",
                    Values:[
                        "100"
                    ]
                }
            ]
        };
        console.log("running get all images");
        App.blockUI({
            animate: true
        });
        ec2.describeImages(params, function(err, data) {
            if (err)
                console.log(err, err.stack); // an error occurred
            else{
                console.log(data);           // successful response
            }
            App.unblockUI();
        });
    }

    return{
        init: init
    }
});
