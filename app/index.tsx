import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";

export default function Random() {
  const router = useRouter();
  const [expandingTile, setExpandingTile] = useState<null | "expense" | "food" | "dish" | "charts">(null);
  const flipAnim1 = useRef(new Animated.Value(0)).current;
  const flipAnim2 = useRef(new Animated.Value(0)).current;
  const flipAnim3 = useRef(new Animated.Value(0)).current; // new animation for dish viewer
  const flipAnim4 = useRef(new Animated.Value(0)).current; // charts

  const expandTile = (animation: Animated.Value, navigateTo: "/expenseForm" | "/foodRating" | "/dishViewer" | "/charts", tile: "expense" | "food" | "dish" | "charts") => {
    setExpandingTile(tile);
    Animated.timing(animation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      router.push(navigateTo as any);
      setTimeout(() => {
        animation.setValue(0);
        setExpandingTile(null);
      }, 100);
    });
  };

  const tileStyle = (animation: Animated.Value) => ({
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 64], // Scale up to 8x original size
        }),
      },
    ],
    borderRadius: animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [20, 50, 0], // Start rounded, become less rounded, then square
    }),
    opacity: animation.interpolate({
      inputRange: [0, 0.8, 1],
      outputRange: [.8, 0.9, 1], // Fade out as it expands
    }),
  });

  const textOpacity = (animation: Animated.Value) =>
    animation.interpolate({
      inputRange: [0, 0.33, 1],
      outputRange: [1, 0, 0], // Fade out in first third
    });

  return (
    <LinearGradient
      colors={["#43cea2", "#185a9d", "#f7971e"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}
    >
      <Text style={styles.title}>Welcome</Text>
      {(expandingTile === null || expandingTile === "expense") && (
        <TouchableWithoutFeedback
          onPress={() => expandTile(flipAnim1, "/expenseForm", "expense")}
        >
          <Animated.View style={[styles.tile, tileStyle(flipAnim1)]}>
            <LinearGradient
              colors={["#8e24aa", "#43ea7f", "#00c853"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientTile}
            >
              <Animated.Text style={[styles.tileText, { opacity: textOpacity(flipAnim1) }]}>Submit an Expense</Animated.Text>
            </LinearGradient>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
      {(expandingTile === null || expandingTile === "food") && (
        <View style={{ height: 20 }} />
      )}
      {(expandingTile === null || expandingTile === "food") && (
        <TouchableWithoutFeedback
          onPress={() => expandTile(flipAnim2, "/foodRating", "food")}
        >
          <Animated.View style={[styles.tile, tileStyle(flipAnim2)]}>
            <LinearGradient
              colors={["#FFA726", "#FFEB3B", "#FFD600"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientTile}
            >
              <Animated.Text style={[styles.tileText, { opacity: textOpacity(flipAnim2) }]}>Submit a Food Rating</Animated.Text>
            </LinearGradient>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
      {(expandingTile === null || expandingTile === "dish") && (
        <View style={{ height: 20 }} />
      )}
      {(expandingTile === null || expandingTile === "dish") && (
        <TouchableWithoutFeedback
          onPress={() => expandTile(flipAnim3, "/dishViewer", "dish")}
        >
          <Animated.View style={[styles.tile, tileStyle(flipAnim3)]}>
            <LinearGradient
              colors={["#2196F3", "#21CBF3", "#64B5F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientTile}
            >
              <Animated.Text style={[styles.tileText, { opacity: textOpacity(flipAnim3) }]}>View a Dish</Animated.Text>
            </LinearGradient>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
      {(expandingTile === null || expandingTile === "charts") && (
        <View style={{ height: 20 }} />
      )}
      {(expandingTile === null || expandingTile === "charts") && (
        <TouchableWithoutFeedback
          onPress={() => expandTile(flipAnim4, "/charts", "charts")}
        >
          <Animated.View style={[styles.tile, tileStyle(flipAnim4)]}>
            <LinearGradient
              colors={["#0f2027", "#203a43", "#2c5364"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientTile}
            >
              <Animated.Text style={[styles.tileText, { opacity: textOpacity(flipAnim4) }]}>View Charts</Animated.Text>
            </LinearGradient>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    marginBottom: 50,
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
  tile: {
    width: 200,
    height: 120,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientTile: {
    ...StyleSheet.flatten({
      width: '100%',
      height: '100%',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    }),
  },
  tileText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 10,
  },
});
