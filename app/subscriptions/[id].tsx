import {View, Text} from 'react-native'
import {Link, useLocalSearchParams} from "expo-router";

const SubscriptionDetails= () => {
    const { id } = useLocalSearchParams<{ id : string }>();

    return (
        <View>
            <Text>Subscription Details</Text>
            <Text>{id ?? 'Unknown subscription'}</Text>
            <Link href = "/"> Go back</Link>
        </View>
    )
}
    export default SubscriptionDetails
