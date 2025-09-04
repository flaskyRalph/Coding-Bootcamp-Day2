import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, DataTable, Dialog, FAB, Paragraph, Portal, TextInput, Title } from 'react-native-paper';
import { generateDailyReport, getPaymentsByDateRange, Payment, updatePaymentStatus } from '../../app/lib/Payments';
import { auth } from '../../app/lib/firebase';

export default function PaymentRecordsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [orNumber, setOrNumber] = useState('');
  const [dailyReport, setDailyReport] = useState<any>(null);

  useEffect(() => {
    loadPayments();
  }, [startDate, endDate]);

  const loadPayments = async () => {
    try {
      const fetchedPayments = await getPaymentsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setPayments(fetchedPayments);
      
      const report = await generateDailyReport(new Date().toISOString().split('T')[0]);
      setDailyReport(report);
    } catch (error) {
      Alert.alert('Error', 'Failed to load payment records');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayment || !orNumber) {
      Alert.alert('Error', 'Please enter OR number');
      return;
    }

    try {
      await updatePaymentStatus(
        selectedPayment.id!,
        'paid',
        auth.currentUser!.uid,
        orNumber
      );
      Alert.alert('Success', 'Payment marked as paid');
      setShowPaymentDialog(false);
      setOrNumber('');
      loadPayments();
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Payment Records</Title>

      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title>Today's Summary</Title>
          {dailyReport && (
            <>
              <View style={styles.summaryRow}>
                <Paragraph>Total Transactions:</Paragraph>
                <Paragraph style={styles.summaryValue}>{dailyReport.totalTransactions}</Paragraph>
              </View>
              <View style={styles.summaryRow}>
                <Paragraph>Total Amount:</Paragraph>
                <Paragraph style={styles.summaryValue}>{formatAmount(dailyReport.totalAmount)}</Paragraph>
              </View>
              <View style={styles.summaryRow}>
                <Paragraph>Cash:</Paragraph>
                <Paragraph style={styles.summaryValue}>{formatAmount(dailyReport.totalCash)}</Paragraph>
              </View>
              <View style={styles.summaryRow}>
                <Paragraph>GCash:</Paragraph>
                <Paragraph style={styles.summaryValue}>{formatAmount(dailyReport.totalGCash)}</Paragraph>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.filterCard}>
        <Card.Content>
          <Title>Filter by Date Range</Title>
          <View style={styles.dateRow}>
            <Button mode="outlined" onPress={() => setShowStartPicker(true)}>
              From: {startDate.toLocaleDateString()}
            </Button>
            <Button mode="outlined" onPress={() => setShowEndPicker(true)}>
              To: {endDate.toLocaleDateString()}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}

      <Card style={styles.tableCard}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Service</DataTable.Title>
            <DataTable.Title>Amount</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title>OR#</DataTable.Title>
          </DataTable.Header>

          {payments.map((payment) => (
            <DataTable.Row 
              key={payment.id}
              onPress={() => {
                if (payment.paymentStatus === 'pending') {
                  setSelectedPayment(payment);
                  setShowPaymentDialog(true);
                }
              }}
            >
              <DataTable.Cell>{payment.serviceId}</DataTable.Cell>
              <DataTable.Cell>{formatAmount(payment.amount)}</DataTable.Cell>
              <DataTable.Cell>
                <Chip 
                  style={{ 
                    backgroundColor: payment.paymentStatus === 'paid' ? '#28a745' : '#ffa500' 
                  }}
                  textStyle={{ color: '#fff', fontSize: 10 }}
                >
                  {payment.paymentStatus}
                </Chip>
              </DataTable.Cell>
              <DataTable.Cell>{payment.orNumber || '-'}</DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Pagination
            page={0}
            numberOfPages={1}
            onPageChange={() => {}}
            label={`${payments.length} records`}
          />
        </DataTable>
      </Card>

      <Portal>
        <Dialog visible={showPaymentDialog} onDismiss={() => setShowPaymentDialog(false)}>
          <Dialog.Title>Mark Payment as Paid</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="OR Number"
              value={orNumber}
              onChangeText={setOrNumber}
              placeholder="OR-2025-00001"
              mode="outlined"
            />
            {selectedPayment && (
              <View style={styles.paymentDetails}>
                <Paragraph>Amount: {formatAmount(selectedPayment.amount)}</Paragraph>
                <Paragraph>Service: {selectedPayment.serviceId}</Paragraph>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onPress={handleMarkAsPaid}>Confirm Payment</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="printer"
        style={styles.fab}
        onPress={() => Alert.alert('Print Report', 'Daily report will be printed')}
      />
    </ScrollView>
  );
}

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
  summaryCard: {
    margin: 10,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  filterCard: {
    margin: 10,
    elevation: 3,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  tableCard: {
    margin: 10,
    elevation: 3,
  },
  paymentDetails: {
    marginTop: 15,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});


