import { View, Text, SafeAreaView, Image, StyleSheet, TouchableOpacity, Alert, FlatList, Button } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Paho from 'paho-mqtt';
import { Dimensions } from 'react-native';
import ProfileIcon from '../../../assets/tsxicons/profilenavbaricon';
import SaveIcon from '../../../assets/tsxicons/saveicon';
import LogoutIcon from '../../../assets/tsxicons/logout';
import { supabase } from '../../../utils/supabase';
import { router } from 'expo-router'
import Input from '../../../components/input';
import DefButton from '../../../components/button';
import CustomAlert from '../../../components/CustomAlert';  

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

const signOut = async () => {
  try {
    if (global.mqttClient && global.mqttClient.isConnected()) {
      try {
        // Send offline presence message
        const offlineMessage = {
          userId: global.userId,
          username: global.username || 'anonymous',
          status: 'offline',
          timestamp: new Date().toISOString()
        };
        
        const presenceMessage = new Paho.Message(JSON.stringify(offlineMessage));
        presenceMessage.destinationName = `users/${global.userId}/presence`;
        presenceMessage.qos = 0;
        presenceMessage.retained = true;
        
        global.mqttClient.send(presenceMessage);
        console.log('Published offline presence message');
        
        // Disconnect MQTT client
        global.mqttClient.disconnect();
        console.log('Disconnected from MQTT broker');
      } catch (error) {
        console.error('Error disconnecting MQTT:', error);
      }
    }
    
    // Clear global variables
    global.mqttClient = null;
    global.userId = null;
    global.username = null;
    
    // Clear AsyncStorage
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('username');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    console.log('User signed out successfully');
    router.replace('../../login');
  } catch (error) {
    console.error('Error during sign out:', error);
  }
};

const findUserByUsername = async (username: string) => {
  console.log("Searching for username:", username); 
  
  const { data, error } = await supabase 
    .from('User_Metadata')
    .select('user_id, name, username') 
    .ilike('username', username.trim()) // Case-insensitive and trim whitespace
    .single();

  if (error) {
    console.log("Error finding user:", error.message, error.code); 
    
    if (error.code === 'PGRST116') { 
      return null;
    }
    throw error;
  }
  
  console.log("Found user:", data); 
  return data;
};

const sendFriendRequest = async (receiverId: string) => {
  const {data: currentUser } = await supabase.auth.getUser();

  if (!currentUser?.user?.id) {
    throw new Error('Not authenticated');
  }

  // Check if a request already exists 
  const { data: existingRequest, error: checkError} = await supabase 
    .from('friend_connections')
    .select('id, status')
    .or(
      `and(sender_id.eq.${currentUser.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.user.id})`
    )
    .maybeSingle();

  if (checkError) throw checkError;

  if(existingRequest) {
    return {
      success: false,
      message: `A connection already exists with status: ${existingRequest.status}`
    };
  }

  const { data, error } = await supabase
    .from('friend_connections')
    .insert({
      sender_id: currentUser.user.id,
      receiver_id: receiverId,
      status: 'pending'
    })
    .select()
    .single();
    
  if (error) throw error;
  
  return {
    success: true,
    data
  };
};

const sendFriendRequestByUsername = async (username: string) => {
  const user = await findUserByUsername(username)

  if (!user) {
    return {
      success: false,
      message: `User ${username} not found`
    }
  }

  return sendFriendRequest(user.user_id)
}

// Function to accept a friend request
const acceptFriendRequest = async (connectionId: string) => {
  try {
    // Update the status
    const { data, error } = await supabase
      .from('friend_connections')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString() // Update the timestamp
      })
      .eq('id', connectionId)
      .select()
      .single();
      
    if (error) {
      console.error("Error accepting friend request:", error.message);
      throw error;
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error);
    throw error;
  }
};

// Function to get pending friend requests for the current user
const getPendingFriendRequests = async () => {
  const { data: currentUser } = await supabase.auth.getUser();

  if (!currentUser?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('friend_connections')
      .select('id, status, sender_id')
      .eq('receiver_id', currentUser.user.id)
      .eq('status', 'pending');
      
    if (requestsError) {
      console.error("Error fetching pending requests:", requestsError.message);
      throw requestsError;
    }
    
    if (!pendingRequests || pendingRequests.length === 0) {
      return [];
    }
    
    const senderIds = pendingRequests.map(request => request.sender_id);
    
    const { data: sendersMetadata, error: metadataError } = await supabase
      .from('User_Metadata')
      .select('user_id, name, username')
      .in('user_id', senderIds);
      
    if (metadataError) {
      console.error("Error fetching senders metadata:", metadataError.message);
      throw metadataError;
    }
    
    // Merge the data
    const requestsWithMetadata = pendingRequests.map(request => {
      const senderMetadata = sendersMetadata.find(metadata => metadata.user_id === request.sender_id);
      return {
        id: request.id,
        status: request.status,
        sender_id: request.sender_id,
        User_Metadata: senderMetadata || { name: 'Unknown', username: 'unknown' }
      };
    });
    
    return requestsWithMetadata;
  } catch (error) {
    console.error("Error in getPendingFriendRequests:", error);
    throw error;
  }
};

const getFriends = async () => {
  const { data: currentUser } = await supabase.auth.getUser();

  if (!currentUser?.user?.id) {
    throw new Error('Not authenticated');
  }

  try {
    // First get all connections where this user is either sender or receiver and status is accepted
    const { data: sentConnections, error: sentError } = await supabase
      .from('friend_connections')
      .select('id, receiver_id')
      .eq('sender_id', currentUser.user.id)
      .eq('status', 'accepted');
      
    if (sentError) throw sentError;
    
    const { data: receivedConnections, error: receivedError } = await supabase
      .from('friend_connections')
      .select('id, sender_id')
      .eq('receiver_id', currentUser.user.id)
      .eq('status', 'accepted');
      
    if (receivedError) throw receivedError;
    
    // Then get user metadata for all friend IDs
    const sentFriendIds = sentConnections.map(conn => conn.receiver_id);
    const receivedFriendIds = receivedConnections.map(conn => conn.sender_id);
    const allFriendIds = [...sentFriendIds, ...receivedFriendIds];
    
    if (allFriendIds.length === 0) {
      return [];
    }
    
    const { data: friendsMetadata, error: metadataError } = await supabase
      .from('User_Metadata')
      .select('user_id, name, username')
      .in('user_id', allFriendIds);
      
    if (metadataError) throw metadataError;
    
    // Map connections to include user metadata
    const sentFriends = sentConnections.map(conn => {
      const metadata = friendsMetadata.find(m => m.user_id === conn.receiver_id) || { name: 'Unknown', username: 'unknown' };
      return {
        connectionId: conn.id,
        userId: conn.receiver_id,
        name: metadata.name,
        username: metadata.username
      };
    });
    
    const receivedFriends = receivedConnections.map(conn => {
      const metadata = friendsMetadata.find(m => m.user_id === conn.sender_id) || { name: 'Unknown', username: 'unknown' };
      return {
        connectionId: conn.id,
        userId: conn.sender_id,
        name: metadata.name,
        username: metadata.username
      };
    });
    
    // Combine both arrays
    return [...sentFriends, ...receivedFriends];
  } catch (error) {
    console.error("Error in getFriends:", error);
    throw error;
  }
};

const enable2FA = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Toggle 2FA status in the database
    const { data, error } = await supabase
      .from('User_Metadata')
      .update({ '2FA': true })
      .eq('user_id', user.id)
      .select('2FA')
      .single();
      
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      enabled: data['2FA']
    };
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    return {
      success: false,
      error
    };
  }
};

const check2FAStatus = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('User_Metadata')
      .select('2FA')
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      return false;
    }
    
    return data['2FA'] || false;
  } catch (error) {
    console.error("Error checking 2FA status:", error);
    return false;
  }
};

const disable2FA = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Toggle 2FA status to false in the database
    const { data, error } = await supabase
      .from('User_Metadata')
      .update({ '2FA': false })
      .eq('user_id', user.id)
      .select('2FA')
      .single();
      
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      enabled: data['2FA']
    };
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return {
      success: false,
      error
    };
  }
};

interface PendingRequest {
  id: any;
  status: any;
  sender_id: any;
  User_Metadata: {
    user_id?: any;
    name: string;
    username: string;
  };
}

interface Friend {
  connectionId: any;
  userId: any;
  name: string;
  username: string;
}

const Profile = () => {
  const [profile, setProfile] = useState({ name: '', username: '' });
  const [friendUsername, setFriendUsername] = useState(''); 
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertTitle, setCustomAlertTitle] = useState('Alert');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('add'); 
  const [twofactorauth, setTwofactorAuth] = useState(false);
  const [enabling2FA, setEnabling2FA] = useState(false);

  // Handle 2FA toggle - simplified without camera
  const handle2FAToggle = async () => {
    if (twofactorauth) {
      // Disabling 2FA
      setEnabling2FA(true);
      try {
        const result = await disable2FA();
        
        if (result.success) {
          setTwofactorAuth(false);
        } else {
          setCustomAlertTitle('Error');
          setCustomAlertMessage('Failed to disable two-factor authentication');
          setCustomAlertVisible(true);
        }
      } catch (error) {
        console.error("Error disabling 2FA:", error);
        setCustomAlertTitle('Error');
        setCustomAlertMessage('An error occurred while disabling 2FA');
        setCustomAlertVisible(true);
      } finally {
        setEnabling2FA(false);
      }
    } else {
      // Enabling 2FA
      setEnabling2FA(true);
      try {
        const result = await enable2FA();
        
        if (result.success) {
          // nothing right now
        } else {
          setCustomAlertTitle('Error');
          setCustomAlertMessage('Failed to enable two-factor authentication');
          setCustomAlertVisible(true);
        }
      } catch (error) {
        console.error("Error enabling 2FA:", error);
        setCustomAlertTitle('Error');
        setCustomAlertMessage('An error occurred while enabling 2FA');
        setCustomAlertVisible(true);
      } finally {
        setEnabling2FA(false);
      }
    }
  };

  // Check 2FA status when component loads
  useEffect(() => {
    const load2FAStatus = async () => {
      const status = await check2FAStatus();
      setTwofactorAuth(status);
    };
    
    load2FAStatus();
  }, []);

  const fetchPendingRequests = async () => {
    setIsLoading(true);
    try {
      const requests = await getPendingFriendRequests();
      setPendingRequests(requests || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Failed to load friend requests');
      setCustomAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const friendsList = await getFriends();
      setFriends(friendsList || []);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Failed to load friends');
      setCustomAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    setIsLoading(true);
    try {
      const result = await acceptFriendRequest(connectionId);
      if (result.success) {
        setCustomAlertTitle('Success');
        setCustomAlertMessage('Friend request accepted!');
        setCustomAlertVisible(true);
        fetchPendingRequests();
        fetchFriends();
      } else {
        setCustomAlertTitle('Error');
        setCustomAlertMessage(result.success ? 'Friend request accepted!' : 'Failed to accept request');
        setCustomAlertVisible(true);
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Failed to accept friend request');
      setCustomAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setCustomAlertTitle('Error');
        setCustomAlertMessage(userError.message);
        setCustomAlertVisible(true);
        return;
      }

      if (user) {
        const { data, error } = await supabase
          .from('User_Metadata')
          .select('name, username')
          .eq('user_id', user.id)
          .single();

        if (error) {
          setCustomAlertTitle('Error');
          setCustomAlertMessage(error.message);
          setCustomAlertVisible(true);
        } else {
          setProfile({ name: data.name, username: data.username });
        }
      }
    };

    fetchProfile();
    
    if (activeTab === 'requests') {
      fetchPendingRequests();
    } else if (activeTab === 'friends') {
      fetchFriends();
    }
  }, [activeTab]);

  const handleSendRequest = async () => {
    if(!friendUsername.trim()) {
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Please enter username');
      setCustomAlertVisible(true);
      return;
    }
    
    try {
      const result = await sendFriendRequestByUsername(friendUsername.trim());
      
      if (result.success) {
        setCustomAlertTitle('Success');
        setCustomAlertMessage('Friend request sent successfully');
        setCustomAlertVisible(true);
        setFriendUsername(''); 
      } else {
        setCustomAlertTitle('Error');
        setCustomAlertMessage(result.message || 'Failed to send request');
        setCustomAlertVisible(true);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      setCustomAlertTitle('Error');
      setCustomAlertMessage((error as Error).message || 'Error sending request');
      setCustomAlertVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionTitle}>
        <ProfileIcon color={'#6E49EB'} fill={'white'} />
        <Text style={styles.sectionTitleText}>Profile</Text>
      </View>
      <View style={styles.upperRow}>
        <View style={styles.circle}>
          <Image
            source={require('../../../assets/placeholderprofilepic.jpg')}
            resizeMode='cover'
            style={styles.image}
          />
        </View>
        <Text style={styles.nameofuser}>{profile.name}</Text>
        <Text style={styles.username}>{profile.username}</Text>
      </View>

      <View style={styles.subsectiontitle}>
        <Text style={styles.subsectiontitletext}>Preferences</Text>
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            { backgroundColor: twofactorauth ? '#ff6b6b' : '#6E49EB' }
          ]}
          onPress={async () => {
            await handle2FAToggle();
            if (!twofactorauth) { 
              router.push('../FaceAuthTakePic');
            }
          }}
          disabled={enabling2FA}
        >
          <Text style={styles.toggleButtonText}>
            {enabling2FA ? 'Processing...' : (twofactorauth ? "Disable 2FA" : "Enable 2FA")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={signOut}>
          <LogoutIcon stroke="#6E49EB" strokeWidth={18} width={24} height={24} fillColor="none" />
          <View style={styles.optiontitle}>
            <Text style={styles.optiontext}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.subsectiontitle}>
        <Text style={styles.subsectiontitletext}>Friends</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'add' && styles.activeTab]} 
            onPress={() => setActiveTab('add')}
          >
            <Text style={styles.tabText}>Add Friend</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]} 
            onPress={() => setActiveTab('requests')}
          >
            <Text style={styles.tabText}>Requests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]} 
            onPress={() => setActiveTab('friends')}
          >
            <Text style={styles.tabText}>My Friends</Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'add' && (
          <View style={styles.addFriendContainer}>
            <Input 
              onChangeText={setFriendUsername} 
              placeholder='Enter username' 
              value={friendUsername} 
            />
            <DefButton text='Add friend' onPress={handleSendRequest} />
          </View>
        )}
        
        {activeTab === 'requests' && (
          <View style={styles.requestsContainer}>
            {isLoading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : pendingRequests.length === 0 ? (
              <Text style={styles.emptyStateText}>No pending friend requests</Text>
            ) : (
              <FlatList
                data={pendingRequests}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.requestItem}>
                    <View style={styles.requestUserInfo}>
                      <Text style={styles.requestUserName}>{item.User_Metadata.name}</Text>
                      <Text style={styles.requestUsername}>@{item.User_Metadata.username}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.acceptButton} 
                      onPress={() => handleAcceptRequest(item.id)}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        )}
        
        {activeTab === 'friends' && (
          <View style={styles.friendsContainer}>
            {isLoading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : friends.length === 0 ? (
              <Text style={styles.emptyStateText}>You don't have any friends yet</Text>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.connectionId}
                renderItem={({ item }) => (
                  <View style={styles.friendItem}>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{item.name}</Text>
                      <Text style={styles.friendUsername}>@{item.username}</Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </View>

      <CustomAlert
        visible={customAlertVisible}
        title={customAlertTitle}
        message={customAlertMessage}
        onClose={() => setCustomAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    alignItems: 'center',
    fontWeight: '700',
  },
  sectionTitleText: {
    fontWeight: '700',
    fontSize: 32,
    color: '#6E49EB',
    margin: 10,
  },
  upperRow: {
    marginHorizontal: width * 0.02,
    marginVertical: height * 0.01,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  circle: {
    width: 100,           
    height: 100,
    borderRadius: 70,  
    overflow: 'hidden',   
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc', 
    margin: 10
  },
  image: {
    width: '100%',
    height: '100%',
  },
  nameofuser: {
    fontSize: width > 600 ? 20 : 16,
    fontWeight: '600'
  },
  username: {
    fontSize: width > 600 ? 18 : 14,
    color: '#A4A4A8'
  },
  subsectiontitle: {
    marginHorizontal: 10
  },
  subsectiontitletext: {
    fontSize: width > 600 ? 18 : 14,
    color: '#A4A4A8',
    fontWeight: '500',
    margin: 10
  },
  option: {
    flexDirection: 'row',
    backgroundColor: 'white',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 5
  },
  optiontitle: {
    margin: 10,
  },
  optiontext: {
    fontSize: 16,
    fontWeight: '500'
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6E49EB',
    backgroundColor: '#f8f4ff',
  },
  tabText: {
    fontWeight: '500',
  },
  addFriendContainer: {
    marginBottom: 10,
  },
  requestsContainer: {
    marginBottom: 15,
  },
  loadingText: {
    padding: 15,
    textAlign: 'center',
    color: '#666',
  },
  emptyStateText: {
    padding: 15,
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
  },
  requestUserInfo: {
    flex: 1,
  },
  requestUserName: {
    fontSize: 16,
    fontWeight: '500',
  },
  requestUsername: {
    fontSize: 14,
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#6E49EB',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  friendsContainer: {
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  friendUsername: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 10,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;