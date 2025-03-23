import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();
const API_URL = "http://192.168.100.51:5000/jobs";  // Special IP for Android Emulator
  // Backend API URL

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (email === "admin" && password === "1234") {
      await AsyncStorage.setItem("user", email);
      navigation.replace("JobListings");
    } else {
      Alert.alert("Error", "Invalid Credentials");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <TextInput placeholder="Email" style={{ borderWidth: 1, width: 250, margin: 10, padding: 8 }} value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry style={{ borderWidth: 1, width: 250, margin: 10, padding: 8 }} value={password} onChangeText={setPassword} />
      <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: "green", padding: 10 }}>
        <Text style={{ color: "white" }}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const JobListingsScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(API_URL);
        setJobs(response.data);
        await AsyncStorage.setItem("jobs", JSON.stringify(response.data));
      } catch (error) {
        const offlineJobs = await AsyncStorage.getItem("jobs");
        if (offlineJobs) {
          setJobs(JSON.parse(offlineJobs));
        } else {
          Alert.alert("Error", "Failed to fetch jobs");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>Job Listings</Text>
      {loading ? <ActivityIndicator size="large" color="blue" /> : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate("JobDetails", { job: item })} style={{ padding: 10, borderBottomWidth: 1, marginBottom: 5 }}>
              <Text style={{ fontSize: 18 }}>{item.title}</Text>
              <Text>{item.company} - {item.location}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const JobDetailsScreen = ({ route }) => {
  const { job } = route.params;
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>{job.title}</Text>
      <Text style={{ fontSize: 18, marginVertical: 10 }}>{job.company} - {job.location}</Text>
      <Text>{job.description}</Text>
      <Text style={{ fontWeight: "bold", marginTop: 10 }}>Requirements:</Text>
      <Text>{job.requirements}</Text>
    </View>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="JobListings" component={JobListingsScreen} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
