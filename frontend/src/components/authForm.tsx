import { useState } from "react";
import { TouchableOpacity, Text, TextInput, StyleSheet } from "react-native"


export const AuthForm = ({
    title,
    handleSubmit,
}: {
    title: string,
    handleSubmit: (username: string, password: string) => void
}) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    return (
        <>
            <Text style={styles.title}>{title}</Text>
            
            <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
            />

            <TouchableOpacity onPress={async () => {handleSubmit(username, password)}} style={styles.btn}>
                <Text style={styles.btnText}>Log In</Text>
            </TouchableOpacity>
        </>
    )
}

const styles = StyleSheet.create({
    title: { fontSize: 24, color: 'white', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15 },
    btn: { backgroundColor: '#4cd137', padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { fontWeight: 'bold' },
});