import {FC} from "react";
import {useRouter} from "next/router";
import styles from "@/styles/StackedButtons.module.css";
import {getMonth, getISOWeek, getISOWeekYear, getDayOfYear} from "date-fns";

const Home: FC = () => {
  const router = useRouter();

  const getMonthInstance = () => {
    const now = new Date();
    return `${now.getFullYear()}${String(getMonth(now) + 1).padStart(2, "0")}`;
  };

  const getWeekInstance = () => {
    const now = new Date();
    return `${getISOWeekYear(now)}${String(getISOWeek(now)).padStart(2, "0")}`;
  };

  const getDayInstance = () => {
    const now = new Date();
    return `${now.getFullYear()}${String(getDayOfYear(now)).padStart(3, "0")}`;
  };

  const handleNavigate = (period: "month" | "week" | "day") => {
    let instance: string;
    switch (period) {
      case "month":
        instance = getMonthInstance();
        break;
      case "week":
        instance = getWeekInstance();
        break;
      case "day":
        instance = getDayInstance();
        break;
    }
    router.push(`/session/${period}/${instance}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.buttonContainer}>
        <button
          className={styles.button}
          onClick={() => handleNavigate("month")}
        >
          This Month
        </button>
        <button
          className={styles.button}
          onClick={() => handleNavigate("week")}
        >
          This Week
        </button>
        <button className={styles.button} onClick={() => handleNavigate("day")}>
          Today
        </button>
      </div>
    </div>
  );
};

export default Home;
