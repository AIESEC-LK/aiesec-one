"use client";

import React, { useState } from "react";
import {
  Avatar,
  Center,
  rem,
  Stack,
  Tooltip,
  UnstyledButton
} from "@mantine/core";
import Image from "next/image";
import classes from "./styles.module.scss";
import aiesecHuman from "@app/../../public/aiesec-human-blue.jpg";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Icon,
  IconHome,
  IconLinkPlus,
  IconLogout,
  IconSparkles,
  IconUsersGroup
} from "@tabler/icons-react";

interface NavbarLinkProps {
  icon: Icon;
  label: string;
  active?: boolean;

  onClick?(): void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 150 }}>
      <UnstyledButton
        onClick={onClick}
        className={classes.link}
        data-active={active || undefined}
      >
        <Icon width={24} height={24} />
      </UnstyledButton>
    </Tooltip>
  );
}

const sidebarData = [
  { icon: IconHome, label: "Home", link: "/" },
  { icon: IconSparkles, label: "Opportunities", link: "/opportunities" },
  { icon: IconLinkPlus, label: "Resources", link: "/resources" }
];

export default function Sidebar() {
  const { data } = useSession();
  const [active, setActive] = useState<number | null>(null);
  const router = useRouter();

  const links = sidebarData.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => {
        if (link.link) {
          setActive(index);
          router.push(link.link);
        }
      }}
    />
  ));

  const imageStyles: React.CSSProperties = {
    marginTop: rem(8)
  };

  return (
    <nav className={classes.navbar}>
      <Center>
        <Image
          src={aiesecHuman}
          alt="AIESEC Human"
          width={72}
          style={imageStyles}
        />
      </Center>

      <div className={classes.navbarMain}>
        <Stack justify="center" gap={6}>
          {links}
        </Stack>
      </div>

      <Stack align="center" gap={10}>
        {data?.user && (
          <Tooltip
            label={
              <div>
                <h4>{data.user.name}</h4>
                <p>{data.user.email}</p>
              </div>
            }
            position="right"
          >
            <Avatar size={36} src={data.user.image} alt="User" />
          </Tooltip>
        )}
        <NavbarLink
          icon={IconLogout}
          label="Logout"
          onClick={() =>
            signOut({ callbackUrl: `${window.location.origin}/login` })
          }
        />
      </Stack>
    </nav>
  );
}
