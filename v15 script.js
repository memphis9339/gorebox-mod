//multiplayer mod by memphis/cust for gorebox 15.10.2 (android, arm32)

function toast(msg) {
  Java.perform(function () {
    var context = Java.use("android.app.ActivityThread")
      .currentApplication()
      .getApplicationContext();

    Java.scheduleOnMainThread(function () {
      var toast = Java.use("android.widget.Toast");
      toast
        .makeText(
          Java.use("android.app.ActivityThread")
            .currentApplication()
            .getApplicationContext(),
          Java.use("java.lang.String").$new(msg),
          1 //Toast.LENGTH_LONG
        )
        .show();
    });
  });
}

function main() {
  const idg = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) =>
      ((Math.random() * 16) | 0).toString(16)
    ); //uuid generator

  const base = Process.findModuleByName("libil2cpp.so").base;
  const GOREBOXMENU_START = base.add(0x2432450); //GoreBoxMenu.Start(this)
  const SET_ACTIVE = base.add(0x4918e1c); //UnityEngine.GameObject.SetActive(this, value)
  const CONNECT_USING_SETTIINGS = base.add(0x2640908); //static PhotonNetwork.ConnectUsingSettings(AppSettings appSettings, bool offline)
  const ID = base.add(0x2cc35e8); // ObscuredPrefs.GetString(string key) (вроде правильная сигнатура, лень иду открывать)
  const HAS_KEY = base.add(0x4912394); // PlayerPrefs.HasKey(string key) (тож не уверен, правильная ли сигнатура)
  const NEWS = base.add(0x4be1e70); // UnityWebRequest..ctor(string url, DownloadHandler ...)

  const filePath = "/data/data/com.F2Games.GBDE/files/account.txt"; //userID path
  let uniqueID = null;
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

  const PhotonAppId = ""; //paste your photon app id here
  const PhotonVoiceAppId = ""; //paste your photon voice app id here

  function read_il2cpp_string(strPointer) {
    const stringPtr = strPointer.add(20);
    const length = strPointer.add(16).readInt();
    return Memory.readUtf16String(stringPtr, length);
  }

  const string_new = new NativeFunction(
    Module.findExportByName("libil2cpp.so", "il2cpp_string_new"),
    "pointer",
    ["pointer"]
  );
  const setActive = new NativeFunction(SET_ACTIVE, "void", ["pointer", "bool"]);

  function SetActive(gameObject, value) {
    return setActive(gameObject, value ? 1 : 0);
  }
  function il2cpp_string_new(value) {
    return string_new(Memory.allocUtf8String(value));
  }
  loadUniqueID();

  Interceptor.attach(GOREBOXMENU_START, {
    onEnter(args) {
      this.versionVal = args[0].add(0xac).readPointer(); // version validator bypass
    },
    onLeave(args) {
      SetActive(this.versionVal, false);
    },
  });

  Interceptor.attach(CONNECT_USING_SETTIINGS, {
    onEnter(args) {
      args[0].add(0x8).writePointer(il2cpp_string_new(PhotonAppId)); //AppSettings.AppIdRealtime
      args[0].add(0x14).writePointer(il2cpp_string_new(PhotonVoiceAppId)); //AppSettings.AppIdVoice
    },
  });

  Interceptor.attach(ID, {
    onEnter(args) {
      this.key = read_il2cpp_string(args[0]);
    },
    onLeave(retval) {
      if (this.key === "ID") {
        if (!uniqueID) {
          uniqueID = idg();
          saveUniqueID(uniqueID); // коляски
        }
        retval.replace(il2cpp_string_new(uniqueID));
      }
    },
  });

  Interceptor.attach(HAS_KEY, {
    onLeave(retval) {
      retval.replace(1);
    },
  });
  //toasts
  toast("github.com/memphis9339/gorebox-mod/");
}

setTimeout(main, 700); // задержка, чтоб libil2cpp.so успел лоаднутся и чтобы не было всяких "TypeError: cannot read property 'add' of undefined" и тд
