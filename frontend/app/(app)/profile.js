import React, {useState} from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useAuth} from "../../context/authContext";
import {router} from "expo-router";
import {updateUserProfile} from "../../api/user";
import mediaService from "../../services/mediaService";
import uploadService from "../../services/uploadMediaService";

export default function ProfileScreen() {
    const {user, handleChangePassword} = useAuth();
    const [loading, setLoading] = useState(false);

    // Username state
    const [editUsername, setEditUsername] = useState(false);
    const [username, setUsername] = useState(user?.username || "");

    // Password states
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handlePickImage = async () => {
        try {
            setLoading(true);

            // Use mediaService to pick a single image
            const imageData = await mediaService.handleSingleImagePicker({
                allowsEditing: true,
                aspect: [1, 1],  // Square aspect ratio for profile pictures
                quality: 1.0,
            });

            if (!imageData) {
                setLoading(false);
                return; // User canceled or error occurred
            }

            // Upload the selected image to storage
            const path = `${user.id}/images/profile_pic_${user.username}${imageData.name}`;

            const uploadResult = await uploadService.uploadFile(
                imageData.uri,
                path,
                imageData.type
            );

            if (!uploadResult.success) {
                throw new Error("Failed to upload image");
            }

            // Update user profile with the new image URL
            await updateUserProfile(user.id, {
                profile_pic: uploadResult.publicUrl
            });
            user.profile_pic = uploadResult.publicUrl;

            Alert.alert("Success", "Profile picture updated successfully");
        } catch (error) {
            console.error("Error updating profile picture:", error);
            Alert.alert("Error", "Failed to update profile picture");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUsername = async () => {
        if (!username.trim()) {
            Alert.alert("Error", "Username cannot be empty");
            return;
        }

        setLoading(true);

        try {
            await updateUserProfile(user.id, {username: username, full_name: username});
            user.username = username;
            setEditUsername(false);
            Alert.alert("Success", "Username updated successfully");
        } catch (error) {
            console.error("Error updating username:", error);
            Alert.alert("Error", "Failed to update username");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "All password fields are required");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords don't match");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            // Pass both current and new password to the handleChangePassword method
            const result = await handleChangePassword(currentPassword, newPassword);

            if (result.success) {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setShowPasswordSection(false);
                Alert.alert("Success", "Password changed successfully");
            } else {
                Alert.alert("Error", result.data || "Failed to change password");
            }
        } catch (error) {
            console.error("Error changing password:", error);
            Alert.alert("Error", "Failed to change password: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePickImage} disabled={loading}>
                    {loading ? (
                        <View style={styles.profileImage}>
                            <ActivityIndicator size="large" color="#FFF"/>
                        </View>
                    ) : user?.profile_pic ? (
                        <View style={styles.profileImageContainer}>
                            <Image
                                source={{uri: user.profile_pic}}
                                style={styles.profileImage}
                            />
                            <View style={styles.editIconContainer}>
                                <Ionicons name="camera" size={20} color="white"/>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.profileImageContainer}>
                            <View style={[styles.profileImage, styles.profilePlaceholder]}>
                                <Text style={styles.profilePlaceholderText}>
                                    {user?.username?.charAt(0).toUpperCase() || "U"}
                                </Text>
                            </View>
                            <View style={styles.editIconContainer}>
                                <Ionicons name="camera" size={20} color="white"/>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.nameContainer}>
                    <View style={styles.nameWrapper}>
                        {editUsername ? (
                            <View style={styles.usernameEditContainer}>
                                <TextInput
                                    style={styles.usernameInput}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Enter new username"
                                    autoCapitalize="none"
                                />
                                <View style={styles.usernameButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => {
                                            setUsername(user?.username || "");
                                            setEditUsername(false);
                                        }}
                                    >
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={handleUpdateUsername}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ActivityIndicator size="small" color="#FFF"/>
                                        ) : (
                                            <Text style={styles.buttonText}>Save</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.name}>{user?.username || "User"}</Text>
                                <TouchableOpacity
                                    style={styles.editNameButton}
                                    onPress={() => setEditUsername(true)}
                                >
                                    <Ionicons name="pencil" size={20} color="#1E90FF"/>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.sectionItem}>
                    <Ionicons name="mail-outline" size={24} color="#666"/>
                    <Text style={styles.sectionItemText}>Email: {user?.email}</Text>
                </View>
                {user?.metadata?.creationTime && (
                    <View style={styles.sectionItem}>
                        <Ionicons name="calendar-outline" size={24} color="#666"/>
                        <Text style={styles.sectionItemText}>
                            Joined:{" "}
                            {new Date(user.metadata.creationTime).toLocaleDateString()}
                        </Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={styles.section}
                onPress={() => setShowPasswordSection(!showPasswordSection)}
            >
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Change Password</Text>
                    <Ionicons
                        name={showPasswordSection ? "chevron-up" : "chevron-down"}
                        size={24}
                        color="#666"
                    />
                </View>

                {showPasswordSection && (
                    <View style={styles.passwordSection}>
                        <TextInput
                            style={styles.input}
                            placeholder="Current Password"
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                            style={styles.changePasswordButton}
                            onPress={handlePasswordChange}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFF"/>
                            ) : (
                                <Text style={styles.buttonText}>Change Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.sectionItem}>
                    <Ionicons name="notifications-outline" size={24} color="#666"/>
                    <Text style={styles.sectionItemText}>Notifications</Text>
                </View>
                <View style={styles.sectionItem}>
                    <Ionicons name="lock-closed-outline" size={24} color="#666"/>
                    <Text style={styles.sectionItemText}>Privacy</Text>
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        alignItems: "center",
        paddingVertical: 32,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e5e5",
    },
    profileImageContainer: {
        position: "relative",
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    editIconContainer: {
        position: "absolute",
        bottom: 20,
        right: 0,
        backgroundColor: "#1E90FF",
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    profilePlaceholder: {
        backgroundColor: "#1E90FF",
        justifyContent: "center",
        alignItems: "center",
    },
    profilePlaceholderText: {
        color: "white",
        fontSize: 48,
        fontWeight: "bold",
    },
    nameContainer: {
        width: '100%',
        alignItems: "center",
        marginBottom: 4,
    },
    nameWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    name: {
        fontSize: 24,
        fontWeight: "bold",
        marginRight: 10,
    },
    editNameButton: {
        padding: 5,
    },
    usernameEditContainer: {
        width: 250,
        marginBottom: 10,
    },
    usernameInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        marginBottom: 10,
    },
    usernameButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cancelButton: {
        backgroundColor: "#ccc",
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginRight: 5,
        alignItems: "center",
    },
    saveButton: {
        backgroundColor: "#1E90FF",
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginLeft: 5,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
    email: {
        fontSize: 16,
        color: "#666",
    },
    section: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e5e5",
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#333",
    },
    sectionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
    },
    sectionItemText: {
        fontSize: 16,
        marginLeft: 16,
        color: "#333",
    },
    passwordSection: {
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 12,
        marginBottom: 10,
    },
    changePasswordButton: {
        backgroundColor: "#1E90FF",
        padding: 12,
        borderRadius: 5,
        alignItems: "center",
        marginTop: 10,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        margin: 24,
        backgroundColor: "#ff3b30",
        padding: 15,
        borderRadius: 10,
    },
    logoutText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
        marginLeft: 10,
    },
});