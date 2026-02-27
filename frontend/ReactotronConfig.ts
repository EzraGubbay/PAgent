import Reactotron from "reactotron-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

Reactotron
    .setAsyncStorageHandler(AsyncStorage)
    .configure({
        name: "PAgent",
    })
    .useReactNative({
        asyncStorage: true,
        networking: {
            ignoreUrls: /symbolicate/,
        },
    })
    .connect();

    console.tron = Reactotron;

    Reactotron.clear();