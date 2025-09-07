import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip, Dialog, Paragraph, Portal, Searchbar, Title } from 'react-native-paper';
import AdminGuard from '../../components/AdminGuard';
import { getResidentRecords, ResidentRecord, verifyResident } from '../../lib/ResidentRecords';
import { auth } from '../../lib/firebase';

function ResidentRecordsScreen() {
  const [records, setRecords] = useState<ResidentRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ResidentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ResidentRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchQuery, selectedFilter]);

  const loadRecords = async () => {
    try {
      const fetchedRecords = await getResidentRecords();
      setRecords(fetchedRecords);
    } catch (error) {
      Alert.alert('Error', 'Failed to load resident records');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(r => r.verificationStatus === selectedFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.address.purok.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contactNumber.includes(searchQuery)
      );
    }

    setFilteredRecords(filtered);
  };

  const handleVerifyResident = async (recordId: string, status: 'verified' | 'rejected') => {
    try {
      await verifyResident(recordId, auth.currentUser!.uid, status);
      Alert.alert('Success', `Resident ${status} successfully`);
      loadRecords();
      setShowDetails(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update verification status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'pending': return '#ffa500';
      default: return '#666';
    }
  };

  return (
    <AdminGuard>
      <View style={styles.container}>
        <Title style={styles.title}>Resident Records</Title>
        
        <Searchbar
          placeholder="Search by name, purok, or contact"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <Chip 
            selected={selectedFilter === 'all'} 
            onPress={() => setSelectedFilter('all')}
            style={styles.chip}
          >
            All ({records.length})
          </Chip>
          <Chip 
            selected={selectedFilter === 'pending'} 
            onPress={() => setSelectedFilter('pending')}
            style={styles.chip}
          >
            Pending ({records.filter(r => r.verificationStatus === 'pending').length})
          </Chip>
          <Chip 
            selected={selectedFilter === 'verified'} 
            onPress={() => setSelectedFilter('verified')}
            style={styles.chip}
          >
            Verified ({records.filter(r => r.verificationStatus === 'verified').length})
          </Chip>
          <Chip 
            selected={selectedFilter === 'rejected'} 
            onPress={() => setSelectedFilter('rejected')}
            style={styles.chip}
          >
            Rejected ({records.filter(r => r.verificationStatus === 'rejected').length})
          </Chip>
        </ScrollView>

        <ScrollView style={styles.recordsList}>
          {filteredRecords.map(record => (
            <TouchableOpacity 
              key={record.id} 
              onPress={() => {
                setSelectedRecord(record);
                setShowDetails(true);
              }}
            >
              <Card style={styles.recordCard}>
                <Card.Content>
                  <View style={styles.recordHeader}>
                    <Title style={styles.recordName}>{record.fullName}</Title>
                    <Chip 
                      style={[styles.statusChip, { backgroundColor: getStatusColor(record.verificationStatus) }]}
                      textStyle={{ color: '#fff' }}
                    >
                      {record.verificationStatus.toUpperCase()}
                    </Chip>
                  </View>
                  <Paragraph>Purok {record.address.purok}</Paragraph>
                  <Paragraph>Contact: {record.contactNumber}</Paragraph>
                  <Paragraph>Household Members: {record.householdMembers.length}</Paragraph>
                  <View style={styles.badges}>
                    {record.voterStatus && <Chip style={styles.badge}>Voter</Chip>}
                    {record.seniorCitizen && <Chip style={styles.badge}>Senior</Chip>}
                    {record.pwd && <Chip style={styles.badge}>PWD</Chip>}
                    {record.indigent && <Chip style={styles.badge}>Indigent</Chip>}
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Portal>
          <Dialog visible={showDetails} onDismiss={() => setShowDetails(false)}>
            <Dialog.Title>Resident Details</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView>
                {selectedRecord && (
                  <View style={styles.detailsContainer}>
                    <Title>{selectedRecord.fullName}</Title>
                    <Paragraph>Date of Birth: {selectedRecord.dateOfBirth}</Paragraph>
                    <Paragraph>Civil Status: {selectedRecord.civilStatus}</Paragraph>
                    <Paragraph>Occupation: {selectedRecord.occupation}</Paragraph>
                    <Paragraph>Email: {selectedRecord.email}</Paragraph>
                    <Paragraph>Contact: {selectedRecord.contactNumber}</Paragraph>
                    
                    <Title style={styles.sectionTitle}>Address</Title>
                    <Paragraph>
                      {selectedRecord.address.houseNumber} {selectedRecord.address.street},{'\n'}
                      Purok {selectedRecord.address.purok}, {selectedRecord.address.barangay}
                    </Paragraph>
                    
                    <Title style={styles.sectionTitle}>Household Members</Title>
                    {selectedRecord.householdMembers.map((member, index) => (
                      <Paragraph key={index}>
                        • {member.name} ({member.relationship}, {member.age} years old)
                      </Paragraph>
                    ))}
                    
                    {selectedRecord.verificationStatus === 'pending' && (
                      <View style={styles.verificationButtons}>
                        <Button 
                          mode="contained" 
                          onPress={() => handleVerifyResident(selectedRecord.id, 'verified')}
                          style={[styles.verifyButton, { backgroundColor: '#28a745' }]}
                        >
                          Verify
                        </Button>
                        <Button 
                          mode="contained" 
                          onPress={() => handleVerifyResident(selectedRecord.id, 'rejected')}
                          style={[styles.verifyButton, { backgroundColor: '#dc3545' }]}
                        >
                          Reject
                        </Button>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setShowDetails(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </AdminGuard>
  );
}

export default ResidentRecordsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  searchbar: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  chip: {
    marginRight: 10,
  },
  recordsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  recordCard: {
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  recordName: {
    fontSize: 18,
    flex: 1,
  },
  statusChip: {
    height: 25,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 10,
  },
  badge: {
    marginRight: 5,
    height: 25,
  },
  detailsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5,
  },
  verificationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  verifyButton: {
    flex: 0.45,
  },
});


