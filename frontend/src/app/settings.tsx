import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    SafeAreaView,
    Platform,
    StatusBar,
} from "react-native";
import { loadUserData, saveUserData } from "@/utils/userData";
import { UserData } from "@/types/data";
import { Header } from "@/components/settingsHeader";
import { DataManagementSettings } from "@/components/dataManagementSettings";
import { NotificationsSettings } from "@/components/notificationsSettings";
import { EditNotificationTokenModal } from "@/components/EditNotificationTokenModal";
import { IntegrationsSettings } from "@/components/integrationsSettings";
import { SignOutButton } from "@/components/signOutButton";

export default function SettingsScreen({ navigation, route }: { navigation: any, route: any }) {
    const [userData, setUserData] = useState<UserData>();

    useEffect(() => {
        loadUserData().then((data) => {
            if (data) setUserData(data);
        });
    }, []);

    const [showEditTokenModal, setShowEditTokenModal] = useState<boolean>(false);
    const [updatedNotificationToken, setUpdatedNotificationToken] = useState<string>(userData?.notificationToken || '');

    const onEditToken = (token: string) => {
        // Close modal
        onEditTokenModalClose();

        // Update user data with new token
        setUpdatedNotificationToken(token);
        if (userData) saveUserData({ ...userData, notificationToken: token });
    }

    const onEditTokenModalClose = () => {
        setShowEditTokenModal(false);
    }

    return (
        <SafeAreaView style={styles.container}>

            {/* Header */}
            <Header />

            <View style={styles.content}>
            
                {/* Data Management Section */}
                <DataManagementSettings route={route} />

                {/* Notifications Section */}
                <NotificationsSettings 
                    updatedNotificationToken={updatedNotificationToken}
                    openModal={() => {setShowEditTokenModal(true)}}
                />

                {/* Integrations Section */}
                <IntegrationsSettings />

                {/* Sign Out Button */}
                <SignOutButton />

            </View>

            <EditNotificationTokenModal
                showModal={showEditTokenModal}
                onEdit={onEditToken}
                onClose={onEditTokenModalClose}
            />

        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1C1C1C",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    },
    backButton: {
        padding: 5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
});