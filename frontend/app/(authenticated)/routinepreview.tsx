import { router, Stack } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import ExerciseinRoutine from '../../components/exerciseinRoutine'
import { Dimensions, StyleSheet, Text, Touchable, TouchableOpacity, View } from 'react-native';
import Animated, {
	interpolate,
	useAnimatedRef,
	useAnimatedStyle,
	useScrollViewOffset
} from 'react-native-reanimated';
import DefButton from '../../components/button';
import BackIcon from '../../assets/tsxicons/backIcon';
import DeleteIcon from '../../assets/tsxicons/deleteicon';
import EditIcon from '../../assets/tsxicons/editicon';
import { SafeAreaView } from 'react-native-safe-area-context';

interface routineInfo {
    routineName?: string
}

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 400;

const routinepreview: React.FC<routineInfo> =  () => {
	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	const scrollOffset = useScrollViewOffset(scrollRef);
	const routineName = useSearchParams().get('routineName');

	const imageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
                     // Premikanje slike gor in dol glede na drsenje
					translateY: interpolate(
						scrollOffset.value,
						[-IMG_HEIGHT, 0, IMG_HEIGHT],
						[-IMG_HEIGHT / 2, 0, IMG_HEIGHT * 0.75]
					)
				},
				{
                    // Zoomiranje slike od 2x na 1x
					scale: interpolate(scrollOffset.value, [-IMG_HEIGHT, 0, IMG_HEIGHT], [2, 1, 1])
				}
			]
		};
	});

    //Header bo postopoma izginila med drsenjem.
	const headerAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: interpolate(scrollOffset.value, [0, IMG_HEIGHT / 1.5], [0, 1])
		};
	});

	return (
		<SafeAreaView style={styles.container}>
		  <Stack.Screen
			options={{
			  headerTransparent: true,
			  headerLeft: () => <Text>Back</Text>,
			  headerBackground: () => <Animated.View style={[styles.header, headerAnimatedStyle]} />,
			}}
		  />
		  <View style={{ flex: 1 }}>
			{/* buttons za going back, editing, deleting etc. */}
			<View style={styles.topButtonRow}>
				<View style={styles.backButtonContainer}>
					<TouchableOpacity onPress={() => router.back()}>
						<BackIcon stroke={'white'} width={24} height={24} />
					</TouchableOpacity>
				</View>
				<View style={styles.editDeleteButtonContainer}>
					<TouchableOpacity>
						<DeleteIcon stroke={'white'} width={24} height={24} />
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push('/editroutine')}>
						<EditIcon stroke={'white'}  width={24} height={24} />
					</TouchableOpacity>
				</View>
			</View>
			<Animated.ScrollView
			  ref={scrollRef}
			  scrollEventThrottle={16}
			  contentContainerStyle={{ paddingBottom: 100 }} 
			>
			  <Animated.Image
				source={require('../../assets/backgroundForView.png')}
				style={[styles.image, imageAnimatedStyle]}
			  />
			  <View style={{ backgroundColor: '#fff' }}>
				<Text style={styles.title}>
				  {routineName}
				</Text>
				
			
				<ExerciseinRoutine exerciseName={"Squat"} reps={"3x10"} press={false}  destination="/excercisedescription" />
			  </View>
			</Animated.ScrollView>

			<View style={styles.continue}>
			  <DefButton text="Continue" onPress={() => console.log("workout started")} />
			</View>
		  </View>
		</SafeAreaView>
	  );
	  
};
export default routinepreview;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
	},
	image: {
		width: width,
		height: IMG_HEIGHT
	},
	header: {
		backgroundColor: '#fff',
		height: 100,
		borderWidth: StyleSheet.hairlineWidth
	},
	backButtonContainer: {
		backgroundColor: '#6E49EB',
		borderRadius: 20,
		padding: 10,
		position: 'absolute',
		top: 30, 
		left: 20,
		zIndex: 20,
	  },
	editDeleteButtonContainer: {
		backgroundColor: '#6E49EB',
		borderRadius: 20,
		padding: 10,
		position: 'absolute',
		top: 30, 
		right: 20,
		zIndex: 20,
		flexDirection: 'row'
	},
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
        color: "#6E49EB",
    },
	continue: {
		position: 'absolute',
		bottom: 20,
		left: 20,
		right: 20,

	},
	topButtonRow: {
		flexDirection: 'row'
	}
	 
	  
});