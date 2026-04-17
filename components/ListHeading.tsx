import {View, Text, TouchableOpacity} from 'react-native'


const ListHeading = ({ title, onPress }: ListHeadingProps) => {
    return (
        <View className = "list-head">
            <Text className="list-title">{title}</Text>
            <TouchableOpacity className = "list-action" onPress={onPress} disabled={!onPress}>
            <Text className= "list-action-text"> View all </Text>
            </TouchableOpacity>
        </View>
    )
}
export default ListHeading
