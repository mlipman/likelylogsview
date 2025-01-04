import {FC} from "react";
import {useRouter} from "next/router";
import styles from "@/styles/StackedButtons.module.css";
import {Period, dateToInstanceNum} from "@/utils/dates";

const Home: FC = () => {
  const router = useRouter();

  const handleNavigate = (period: Period) => {
    const instance = dateToInstanceNum(new Date(), period);
    router.push(`/session/${period}/${instance}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.buttonContainer}>
        <button className={styles.button} onClick={() => handleNavigate("month")}>
          This Month
        </button>
        <button className={styles.button} onClick={() => handleNavigate("week")}>
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
