//multiplayer mod by memphis/cust for gorebox 15.10.2 (android, arm32)

//without anticheat

const base = Process.findModuleByName("libil2cpp.so").base;
const GOREBOXMENU_START = base.add(0x2432450);
const SET_ACTIVE = base.add(0x4918E1C);
const CONNECT_USING_SETTIINGS = base.add(0x2640908);
const ID = base.add(0x02CC35E8);
const HAS_KEY = base.add(0x4912394);
const NEWS = base.add(0x4BE1E70)

const PhotonAppId = ""; //paste your photon app id here
const PhotonVoiceAppId = ""; //paste your photon voice app id here

function toast(msg) {
    Java.perform(function () { 
        var context = Java.use('android.app.ActivityThread').currentApplication().getApplicationContext();

        Java.scheduleOnMainThread(function() {
                var toast = Java.use("android.widget.Toast");
                toast.makeText(Java.use("android.app.ActivityThread").currentApplication().getApplicationContext(), Java.use("java.lang.String").$new(msg), 1).show();
            });
    });
}

const filePath = "/data/data/com.F2Games.GBDE/files/account.txt"; //userID path
let uniqueID = null;


function decode(strPointer) {
    const stringPtr = strPointer.add(20);
    const length = strPointer.add(16).readInt();
    return Memory.readUtf16String(stringPtr, length);
}


const string_new = new NativeFunction(Module.findExportByName("libil2cpp.so", "il2cpp_string_new"), "pointer", ["pointer"]);
const setActive = new NativeFunction(SET_ACTIVE, "void", ["pointer", "bool"]);

function loadUniqueID() {
    try {
        const fileRead = new File(filePath, "r");
        uniqueID = fileRead.readLine();
        fileRead.close();
    } catch (e) {
        uniqueID = null;
    }
}

function saveUniqueID(id) {
    try {
        const file = new File(filePath, "w");
        file.write(id);
        file.close();
    } catch (e) {}
}

const idg = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0).toString(16)); //uuid generator

function main() {
    loadUniqueID();

    Interceptor.attach(GOREBOXMENU_START, {
        onEnter(args) {
            this.btn = args[0].add(0xAC).readPointer(); // version validator bypass
        },
        onLeave(args) {
            setActive(this.btn, 0);
        }
    });

    Interceptor.attach(CONNECT_USING_SETTIINGS, {
        onEnter(args) {
            args[0].add(0x8).writePointer(string_new(Memory.allocUtf8String(PhotonAppId)));
            args[0].add(0x14).writePointer(string_new(Memory.allocUtf8String(PhotonVoiceAppId)));
        }
    });

    Interceptor.attach(ID, {
        onEnter(args) {
            this.key = decode(args[0]);
        },
        onLeave(retval) {
            if (this.key === "ID") {
                if (!uniqueID) {
                    uniqueID = idg();
                    saveUniqueID(uniqueID);
                }
                retval.replace(string_new(Memory.allocUtf8String(uniqueID)));
            }
        }
    });

    Interceptor.attach(HAS_KEY, {
        onLeave(retval) {
            retval.replace(1);
        }
    });
}


 //toasts
toast("github.com/memphis9339/gorebox-mod/");

main();
